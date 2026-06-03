const Sentry = require('@sentry/node');

// Sentry v8+ removed Handlers and Integrations.Http/Express.
// Use the new httpIntegration / expressIntegration / setupExpressErrorHandler API.

function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not configured, skipping error tracking setup');
    return;
  }

  const integrations = [];
  if (typeof Sentry.httpIntegration === 'function') {
    integrations.push(Sentry.httpIntegration());
  }
  if (typeof Sentry.expressIntegration === 'function') {
    integrations.push(Sentry.expressIntegration());
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations,
      release: process.env.SENTRY_RELEASE || `roiscout-backend@${process.env.npm_package_version || '1.0.0'}`,
      beforeSend(event, hint) {
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
          return null;
        }
        const error = hint.originalException;
        if (error && error.message) {
          if (error.message.includes('ECONNREFUSED') && error.message.includes('5432')) return null;
          if (error.message.includes('Redis') && error.message.includes('ECONNREFUSED')) return null;
        }
        return event;
      },
      initialScope: {
        tags: { component: 'backend', service: 'roiscout-api' }
      }
    });
    console.log('✅ Sentry error tracking initialized');
  } catch (err) {
    console.warn('⚠️ Sentry init failed (non-fatal):', err.message);
  }
}

// Pass-through no-ops — request/tracing handlers are auto-wired in v8+.
// Error handler is registered via setupExpressErrorHandler(app) in app.js.
function getSentryMiddleware() {
  return {
    requestHandler: (req, res, next) => next(),
    tracingHandler: (req, res, next) => next(),
    errorHandler: (error, req, res, next) => next(error),
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
