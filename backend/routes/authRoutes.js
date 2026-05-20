const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.post('/register', apiLimiter, registerUser);
router.post('/login', apiLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
