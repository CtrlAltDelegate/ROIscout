const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Sentry first
const { initSentry, getSentryMiddleware } = require('./config/sentry');
initSentry();

// Import middleware
const { adaptiveRateLimiter, authLimiter, searchLimiter, exportLimiter } = require('./middleware/rateLimiting');

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const searchRoutes = require('./routes/search');
const stripeRoutes = require('./routes/stripe');
const usageRoutes = require('./routes/usage');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

const app = express();

// Sentry middleware (must be first)
const sentryMiddleware = getSentryMiddleware();
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://roi-scout.netlify.app',
        'https://roiscout.netlify.app',
        // Add your actual Netlify domain here
        process.env.FRONTEND_URL || 'https://your-app.netlify.app'
      ] 
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
  credentials: true,
}));

// Rate limiting - adaptive based on user subscription
app.use('/api/', adaptiveRateLimiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes
app.use('/health', healthRoutes);

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/searches', searchLimiter, searchRoutes);
app.use('/api/export', exportLimiter); // Will be added when we create export routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ROI Scout API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryMiddleware.errorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.details[0].message,
    });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'This record already exists',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Please log in again',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Please log in again',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;
