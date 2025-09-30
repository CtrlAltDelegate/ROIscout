const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

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
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
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
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
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
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
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
        user: {
          id: user.id,
          email: user.email,
          name: name,
          picture: picture,
          createdAt: user.created_at,
        },
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
