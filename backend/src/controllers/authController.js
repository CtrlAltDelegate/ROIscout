const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/** Returns true if this email is in the ADMIN_EMAILS env var. */
const isAdmin = (email) => {
  if (!email || !process.env.ADMIN_EMAILS) return false;
  return process.env.ADMIN_EMAILS
    .split(',')
    .map(e => e.trim().toLowerCase())
    .includes(email.toLowerCase());
};

/** Build the safe user object sent to the client. */
const buildUserPayload = (user) => ({
  id:           user.id,
  email:        user.email,
  plan:         user.subscription_plan || user.plan || 'free',
  is_admin:     isAdmin(user.email),
  createdAt:    user.created_at,
});

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authController = {
  /**
   * Register a new user
   */
  async signup(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'User Already Exists',
          message: 'An account with this email already exists',
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash) 
         VALUES ($1, $2) 
         RETURNING id, email, created_at`,
        [email.toLowerCase(), hashedPassword]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: buildUserPayload(user),
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        error: 'Registration Failed',
        message: 'Unable to create account. Please try again.',
      });
    }
  },

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const result = await query(
        'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid Credentials',
          message: 'Invalid email or password',
        });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid Credentials',
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: buildUserPayload(user),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login Failed',
        message: 'Unable to login. Please try again.',
      });
    }
  },

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const result = await query(
        'SELECT id, email, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User account not found',
        });
      }

      const user = result.rows[0];

      res.json({
        user: buildUserPayload(user),
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to Get Profile',
        message: 'Unable to retrieve user profile',
      });
    }
  },

  /**
   * Forgot password — generate a reset token and email it
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Look up the user — always return 200 to avoid email enumeration
      const result = await query(
        'SELECT id, email FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];

        // Invalidate any existing unused tokens for this user
        await query(
          'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
          [user.id]
        );

        // Generate a cryptographically secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await query(
          'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
          [user.id, tokenHash, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

        // Non-fatal — a delivery failure should never turn into a 500
        try {
          await emailService.sendPasswordResetEmail(user.email, resetUrl);
        } catch (emailErr) {
          console.error('⚠️  Password reset email failed to send:', emailErr.message);
          // In dev/staging, print the link so it can still be tested
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 Reset URL (fallback):', resetUrl);
          }
        }
      }

      // Always respond the same way — don't reveal whether the email exists
      res.json({
        message: "If an account with that email exists, we've sent a password reset link.",
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Request Failed',
        message: 'Unable to process request. Please try again.',
      });
    }
  },

  /**
   * Reset password — validate the token and set a new password
   */
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      // Hash the incoming token to compare against the DB
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const result = await query(
        `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at
         FROM password_reset_tokens prt
         WHERE prt.token_hash = $1`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid Token',
          message: 'This reset link is invalid or has already been used.',
        });
      }

      const tokenRow = result.rows[0];

      if (tokenRow.used_at) {
        return res.status(400).json({
          error: 'Token Used',
          message: 'This reset link has already been used. Please request a new one.',
        });
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        return res.status(400).json({
          error: 'Token Expired',
          message: 'This reset link has expired. Please request a new one.',
        });
      }

      // Hash the new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update the user's password
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, tokenRow.user_id]
      );

      // Mark the token as used
      await query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [tokenRow.id]
      );

      res.json({ message: 'Password updated successfully. You can now sign in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Reset Failed',
        message: 'Unable to reset password. Please try again.',
      });
    }
  },

  /**
   * Google OAuth login
   */
  async googleLogin(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Missing Token',
          message: 'Google token is required',
        });
      }

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      // Check if user exists
      let result = await query(
        'SELECT id, email, created_at FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      let user;
      if (result.rows.length === 0) {
        // Create new user
        result = await query(
          `INSERT INTO users (email, google_id, full_name, profile_picture) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, email, created_at`,
          [email.toLowerCase(), googleId, name, picture]
        );
        user = result.rows[0];
      } else {
        user = result.rows[0];
        
        // Update Google ID if not set
        await query(
          'UPDATE users SET google_id = $1, full_name = $2, profile_picture = $3 WHERE id = $4',
          [googleId, name, picture, user.id]
        );
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Google login successful',
        token: jwtToken,
        user: { ...buildUserPayload(user), name, picture },
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({
        error: 'Google Login Failed',
        message: 'Unable to authenticate with Google. Please try again.',
      });
    }
  },
};

module.exports = authController;
