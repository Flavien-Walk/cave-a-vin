const router = require('express').Router();
const { getSummary, getCaveValue, getDashboard, getInsights } = require('../controllers/statsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary',    authMiddleware, getSummary);
router.get('/cave-value', authMiddleware, getCaveValue);
router.get('/dashboard',  authMiddleware, getDashboard);
router.get('/insights',   authMiddleware, getInsights);

module.exports = router;
