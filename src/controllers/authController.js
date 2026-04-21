const crypto               = require('crypto');
const User                 = require('../models/User');
const PendingVerification  = require('../models/PendingVerification');
const { signToken }        = require('../middleware/auth');
const { sendWelcomeEmail, sendResetCodeEmail, sendVerificationCodeEmail } = require('../services/emailService');

// SHA-256 des codes OTP — défense en profondeur si la DB est compromise
// (les codes expirent en 15 min et sont rate-limited, le hash ajoute une couche)
const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// POST /api/auth/pre-register — envoie un code OTP avant création du compte
exports.preRegister = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });

    const normalizedEmail = email.toLowerCase().trim();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Adresse e-mail déjà utilisée.' });

    const code      = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash  = hashOtp(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PendingVerification.findOneAndUpdate(
      { email: normalizedEmail },
      { code: codeHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Envoi email non-bloquant — la requête réussit même si Brevo échoue
    sendVerificationCodeEmail(normalizedEmail, code).catch(err => {
      console.error(`[pre-register] Erreur Brevo pour ${normalizedEmail}:`, err.message);
    });

    res.json({ message: 'Code de vérification envoyé.' });
  } catch (err) { next(err); }
};

// POST /api/auth/register — crée le compte après vérification du code OTP
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, code } = req.body;
    if (!name || !email || !password || !code)
      return res.status(400).json({ message: 'Nom, email, mot de passe et code de vérification requis.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });

    const normalizedEmail = email.toLowerCase().trim();

    const pending = await PendingVerification.findOne({ email: normalizedEmail });
    if (!pending)
      return res.status(400).json({ message: 'Aucun code envoyé pour cet email. Recommencez depuis le début.' });
    if (pending.expiresAt < new Date())
      return res.status(400).json({ message: 'Code expiré. Demandez-en un nouveau.' });
    if (pending.code !== hashOtp(String(code).trim()))
      return res.status(400).json({ message: 'Code incorrect.' });

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Adresse e-mail déjà utilisée.' });

    const user  = await User.create({ name, email: normalizedEmail, passwordHash: password });
    const token = signToken(user._id);

    await PendingVerification.deleteOne({ email: normalizedEmail });

    sendWelcomeEmail(user).catch(err => console.error('[email] bienvenue:', err.message));

    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects.' });

    const ok = await user.checkPassword(password);
    if (!ok) return res.status(401).json({ message: 'Identifiants incorrects.' });

    const token = signToken(user._id);
    res.json({ token, user: user.toPublic() });
  } catch (err) { next(err); }
};

// GET /api/auth/me  (requires authMiddleware)
exports.me = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

// PUT /api/auth/me  (update name/password)
exports.updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.userId);
    if (name)     user.name = name;
    if (password) {
      if (password.length < 6)
        return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });
      user.passwordHash = password;
    }
    await user.save();
    res.json({ user: user.toPublic() });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email requis.' });

    // Toujours répondre 200 pour ne pas révéler si l'email existe
    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetCode +resetCodeExpiry');
    if (!user) {
      return res.json({ message: 'Si cet email est enregistré, un code a été envoyé.' });
    }

    // Code à 6 chiffres, expire dans 15 minutes — stocké hashé (SHA-256)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode       = hashOtp(code);
    user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendResetCodeEmail(user, code);

    res.json({ message: 'Si cet email est enregistré, un code a été envoyé.' });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password)
      return res.status(400).json({ message: 'Email, code et nouveau mot de passe requis.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetCode +resetCodeExpiry');
    if (!user || !user.resetCode || !user.resetCodeExpiry)
      return res.status(400).json({ message: 'Code invalide ou expiré.' });

    if (user.resetCodeExpiry < new Date())
      return res.status(400).json({ message: 'Code expiré. Demandez-en un nouveau.' });

    if (user.resetCode !== hashOtp(String(code).trim()))
      return res.status(400).json({ message: 'Code incorrect.' });

    // Mise à jour du mot de passe + nettoyage du code
    user.passwordHash    = password;
    user.resetCode       = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ message: 'Mot de passe mis à jour.', token, user: user.toPublic() });
  } catch (err) { next(err); }
};
