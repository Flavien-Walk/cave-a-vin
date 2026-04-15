const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'cave-a-vin-secret-change-in-prod';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '90d' });
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
