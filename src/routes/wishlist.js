const router = require('express').Router();
const c = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',             c.getAll);
router.post('/',            c.create);
router.put('/:id',          c.update);
router.delete('/:id',       c.remove);
router.put('/:id/purchase', c.markPurchased);

module.exports = router;
