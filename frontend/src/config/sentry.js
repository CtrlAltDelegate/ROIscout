import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not configured, skipping error tracking setup');
    return;
  }

  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      new BrowserTracing({
        // Basic browser tracing without React Router integration
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/yourapi\.domain\.com\/api/,
          /^https:\/\/.*\.railway\.app\/api/
        ],
      }),
    ],
    
    // Release tracking
    release: process.env.REACT_APP_SENTRY_RELEASE || `roiscout-frontend@${process.env.REACT_APP_VERSION || '1.0.0'}`,
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_SENTRY_ENABLE_DEV) {
        return null;
      }
      
      // Filter out common non-critical errors
      const error = hint.originalException;
      if (error && error.message) {
        // Skip network errors that are user-related
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          return null;
        }
        
        // Skip ResizeObserver errors (common browser quirk)
        if (error.message.includes('ResizeObserver')) {
          return null;
        }
        
        // Skip non-Error objects
        if (error.message.includes('Non-Error promise rejection')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'frontend',
        service: 'roiscout-web'
      }
    }
  });

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Capture exception with additional context
 */
export function captureException(error, context = {}) {
  if (!process.env.REACT_APP_SENTRY_DSN) {
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
export function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.REACT_APP_SENTRY_DSN) {
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
export function addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
  if (!process.env.REACT_APP_SENTRY_DSN) {
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
export function setUser(user) {
  if (!process.env.REACT_APP_SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    subscription: user.subscription_plan
  });
}

/**
 * React Error Boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default Sentry;
