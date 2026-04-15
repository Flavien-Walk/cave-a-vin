const router = require('express').Router();
const { getSummary } = require('../controllers/statsController');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary', authMiddleware, getSummary);

module.exports = router;
