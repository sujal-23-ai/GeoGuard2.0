const express = require('express');
const router = express.Router();
const { handleMessage, getHistory } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/message', generalLimiter, handleMessage);
router.get('/history', getHistory);

module.exports = router;
