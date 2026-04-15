const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/cavesController');

router.use(authMiddleware);

router.get('/',             ctrl.getAll);
router.post('/',            ctrl.create);
router.put('/:id',          ctrl.update);
router.delete('/:id',       ctrl.remove);
router.put('/:id/default',  ctrl.setDefault);

module.exports = router;
