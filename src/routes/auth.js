const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const multer    = require('multer');
const ctrl      = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max pour les avatars
});

// 10 tentatives par IP par 15 minutes sur les routes sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

// 5 demandes par IP par heure pour l'envoi d'emails (anti-spam Brevo)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de demandes d\'email. Réessayez dans 1 heure.' },
});

router.post('/pre-register',    emailLimiter, ctrl.preRegister);
router.post('/register',        authLimiter,  ctrl.register);
router.post('/login',           authLimiter,  ctrl.login);
router.get( '/me',              authMiddleware, ctrl.me);
router.put( '/me',              authMiddleware, ctrl.updateMe);
router.put( '/avatar',          authMiddleware, upload.single('avatar'), ctrl.uploadAvatar);
router.post('/forgot-password', emailLimiter, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter,  ctrl.resetPassword);

module.exports = router;
