const router = require('express').Router();
const c = require('../controllers/bottlesController');
const { authMiddleware } = require('../middleware/auth');

// Toutes les routes bouteilles nécessitent l'auth
router.use(authMiddleware);

router.get('/recommend',     c.recommend);
router.post('/suggest-wine', c.suggestWine);
router.post('/scan-label',   c.scanLabel);

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
