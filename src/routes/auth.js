const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get( '/me',       authMiddleware, ctrl.me);
router.put( '/me',       authMiddleware, ctrl.updateMe);

module.exports = router;
