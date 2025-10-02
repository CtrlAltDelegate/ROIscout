// src/config/sentry.js
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize Sentry in production or if SENTRY_DSN is provided
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
    });
  }
};

export const SentryErrorBoundary = ({ children, fallback }) => {
  // If Sentry is not initialized, use a simple error boundary
  if (process.env.NODE_ENV !== 'production' || !process.env.REACT_APP_SENTRY_DSN) {
    return (
      <div>
        {children}
      </div>
    );
  }

  return (
    <Sentry.ErrorBoundary fallback={fallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

export const setUser = (user) => {
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.setUser(user);
  }
};