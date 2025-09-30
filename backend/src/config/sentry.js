const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not configured, skipping error tracking setup');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app: undefined }),
      
      // Enable profiling
      new ProfilingIntegration(),
    ],
    
    // Release tracking
    release: process.env.SENTRY_RELEASE || `roiscout-backend@${process.env.npm_package_version || '1.0.0'}`,
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }
      
      // Filter out common non-critical errors
      const error = hint.originalException;
      if (error && error.message) {
        // Skip database connection errors during startup
        if (error.message.includes('ECONNREFUSED') && error.message.includes('5432')) {
          return null;
        }
        
        // Skip Redis connection errors
        if (error.message.includes('Redis') && error.message.includes('ECONNREFUSED')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'backend',
        service: 'roiscout-api'
      }
    }
  });

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Express middleware for Sentry request handling
 */
function getSentryMiddleware() {
  if (!process.env.SENTRY_DSN) {
    return {
      requestHandler: (req, res, next) => next(),
      tracingHandler: (req, res, next) => next(),
      errorHandler: (error, req, res, next) => next(error)
    };
  }

  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all 4xx and 5xx errors
        return error.status >= 400;
      }
    })
  };
}

/**
 * Capture exception with additional context
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error('Error (Sentry not configured):', error);
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the exception
    Sentry.captureException(error);
  });
}

/**
 * Capture message with level
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.log(`${level.toUpperCase()}: ${message}`);
    return;
  }

  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the message
    Sentry.captureMessage(message, level);
  });
}

/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Set user context
 */
function setUser(user) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    subscription: user.subscription_plan
  });
}

module.exports = {
  initSentry,
  getSentryMiddleware,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  Sentry
};
