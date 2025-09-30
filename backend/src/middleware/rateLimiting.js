const rateLimit = require('express-rate-limit');
const { captureMessage } = require('../config/sentry');

/**
 * Create rate limiter with custom configuration
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Default limit
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    
    // Custom key generator to include user ID if authenticated
    keyGenerator: (req) => {
      if (req.user && req.user.id) {
        return `user:${req.user.id}`;
      }
      return req.ip;
    },
    
    // Skip successful requests for certain endpoints
    skip: (req, res) => {
      // Skip rate limiting for health checks
      if (req.path.startsWith('/health')) {
        return true;
      }
      return false;
    },
    
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      // Log rate limit violations
      captureMessage(`Rate limit exceeded for ${req.ip}`, 'warning', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: options.message?.error || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
        limit: options.max,
        windowMs: options.windowMs
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
}

/**
 * General API rate limiter
 */
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many API requests, please try again later.'
  }
});

/**
 * Authentication rate limiter (stricter)
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Search rate limiter (moderate)
 */
const searchLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 searches per 5 minutes
  message: {
    error: 'Too many search requests, please try again in a few minutes.'
  }
});

/**
 * Export rate limiter (strict)
 */
const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    error: 'Export limit reached. Please try again in an hour.'
  }
});

/**
 * Premium user rate limiter (more generous)
 */
const premiumLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for premium users
  message: {
    error: 'Premium rate limit exceeded, please try again later.'
  }
});

/**
 * Middleware to apply different rate limits based on user subscription
 */
function adaptiveRateLimiter(req, res, next) {
  // Check user subscription level
  if (req.user && req.user.subscription_plan) {
    switch (req.user.subscription_plan) {
      case 'pro':
      case 'enterprise':
        return premiumLimiter(req, res, next);
      default:
        return generalLimiter(req, res, next);
    }
  }
  
  // Default rate limiting for non-authenticated users
  return generalLimiter(req, res, next);
}

/**
 * Create custom rate limiter for specific endpoints
 */
function createCustomLimiter(windowMinutes, maxRequests, errorMessage) {
  return createRateLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      error: errorMessage || `Too many requests. Limit: ${maxRequests} per ${windowMinutes} minutes.`
    }
  });
}

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  searchLimiter,
  exportLimiter,
  premiumLimiter,
  adaptiveRateLimiter,
  createCustomLimiter
};
