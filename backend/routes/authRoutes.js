const express = require('express');
const { register, login, setupMFA, verifyMFA, getMfaStatus } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/setup-mfa', protect, setupMFA);
router.post('/verify-mfa', verifyMFA);
router.get('/mfa-status', protect, getMfaStatus);

module.exports = router;
