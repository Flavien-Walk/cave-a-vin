const router     = require('express').Router();
const multer     = require('multer');
const rateLimit  = require('express-rate-limit');
const c          = require('../controllers/bottlesController');
const { authMiddleware } = require('../middleware/auth');

// Validation MIME — accepte uniquement les images réelles
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 }, // 8 Mo max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Type de fichier non autorisé. Envoyez une image JPEG, PNG ou WebP.'), { status: 415 }));
  },
});

// Rate limit spécifique scan-label : 8 scans / 10 min par IP
// Protège le quota Anthropic (coût par token vision)
const scanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de scans. Réessayez dans 10 minutes.' },
});

// Toutes les routes bouteilles nécessitent l'auth
router.use(authMiddleware);

router.get('/recommend',             c.recommend);
router.get('/taste-profile',         c.getTasteProfile);
router.get('/smart-recommendations', c.getSmartRecommendations);
router.post('/suggest-wine',         c.suggestWine);
// scan-label : auth + rate limit spécifique + validation MIME
router.post('/scan-label', scanLimiter, upload.single('image'), c.scanLabel);

router.get('/',    c.getAll);
router.post('/',   c.create);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

router.put('/:id/photo',            upload.single('photo'), c.uploadPhoto);
router.put('/:id/favorite',         c.toggleFavorite);
router.post('/:id/drink',           c.drink);
router.get('/:id/history',          c.getHistory);
router.post('/:id/notes',           c.addNote);
router.delete('/:id/notes/:noteId', c.deleteNote);

module.exports = router;
