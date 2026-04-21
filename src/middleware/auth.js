const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
  process.exit(1);
}

// 30 jours : équilibre UX mobile (pas de reconnexion fréquente) / sécurité
// (token volé valide max 30 jours vs 90). Sans refresh token, c'est le meilleur compromis.
function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });
    req.user   = user;
    req.userId = user._id;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

module.exports = { signToken, authMiddleware };
