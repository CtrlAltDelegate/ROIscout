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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading ROI Scout...</div>
      </div>
    );
  }

  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-4">We've been notified and are working on a fix.</p>
          <button 
            onClick={resetError}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    )}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
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
