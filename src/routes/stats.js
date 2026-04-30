const router = require('express').Router();
const { getSummary, getCaveValue, getDashboard } = require('../controllers/statsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary',    authMiddleware, getSummary);
router.get('/cave-value', authMiddleware, getCaveValue);
router.get('/dashboard',  authMiddleware, getDashboard);

module.exports = router;
