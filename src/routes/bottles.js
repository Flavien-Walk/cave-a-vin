const router  = require('express').Router();
const multer  = require('multer');
const c       = require('../controllers/bottlesController');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 }, // 8 MB max
});

// Toutes les routes bouteilles nécessitent l'auth
router.use(authMiddleware);

router.get('/recommend',             c.recommend);
router.get('/taste-profile',         c.getTasteProfile);
router.get('/smart-recommendations', c.getSmartRecommendations);
router.post('/suggest-wine',         c.suggestWine);
// scan-label reçoit un fichier multipart
router.post('/scan-label',   upload.single('image'), c.scanLabel);

router.get('/',    c.getAll);
router.post('/',   c.create);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

router.put('/:id/favorite',         c.toggleFavorite);
router.post('/:id/drink',           c.drink);
router.get('/:id/history',          c.getHistory);
router.post('/:id/notes',           c.addNote);
router.delete('/:id/notes/:noteId', c.deleteNote);

module.exports = router;
