const express = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', validateSignup, authController.signup);

// POST /api/auth/login - User login
router.post('/login', validateLogin, authController.login);

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
