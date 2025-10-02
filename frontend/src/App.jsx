// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Initialize Sentry
import { initSentry, SentryErrorBoundary, setUser as setSentryUser } from './config/sentry';
initSentry();

// Components
import Header from './components/Layout/Header';
import LandingPage from './components/Landing/LandingPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';

// Services
import { authService } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      authService.verifyToken()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Set user context in Sentry
    setSentryUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSentryUser(null); // Clear Sentry user context on logout
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-gray-900 text-xl font-medium">Loading ROI Scout...</div>
          <div className="text-gray-500 text-sm mt-2">Preparing your investment dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">We've been notified and are working on a fix.</p>
          <button 
            onClick={resetError}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header user={user} onLogout={handleLogout} />
          
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </Router>
    </SentryErrorBoundary>
  );
}

export default App;
