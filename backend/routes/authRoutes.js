const express = require('express');
const { register, login, setupMFA, verifyMFA } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/setup-mfa', protect, setupMFA);
router.post('/verify-mfa', verifyMFA);

module.exports = router;
