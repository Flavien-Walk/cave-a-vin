const User      = require('../models/User');
const { signToken } = require('../middleware/auth');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Nom, email et mot de passe requis.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Adresse e-mail déjà utilisée.' });

    const user  = await User.create({ name, email, passwordHash: password });
    const token = signToken(user._id);
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
