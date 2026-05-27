const express = require('express');
const authController = require('../controllers/authController');
const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', validateSignup, authController.signup);

// POST /api/auth/login - User login
router.post('/login', validateLogin, authController.login);

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authenticateToken, authController.getProfile);

// POST /api/auth/google - Google OAuth login
router.post('/google', authController.googleLogin);

// POST /api/auth/forgot-password - Request password reset email
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// POST /api/auth/reset-password - Set new password using token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;
