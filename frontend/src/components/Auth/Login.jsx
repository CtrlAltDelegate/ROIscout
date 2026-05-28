import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';

const Login = ({ onLogin }) => {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.token);
      onLogin(response.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = React.useCallback(async (response) => {
    setGoogleLoading(true); setError('');
    try {
      const result = await authService.googleLogin(response.credential);
      localStorage.setItem('token', result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [onLogin]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID, callback: handleGoogleLogin });
      }
    };
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [handleGoogleLogin]);

  const handleGoogleButtonClick = () => { if (window.google) window.google.accounts.id.prompt(); };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='rgba(0,0,0,0.04)'/%3E%3C/svg%3E\")" }}
    >
      {/* Wordmark above card */}
      <div className="mb-6 text-xl font-bold">
        <span className="text-green-500">ROI</span>
        <span className="text-slate-900">Scout</span>
      </div>

      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-white/10 p-8">
        <div className="text-center mb-7">
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
            <input
              type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-xs text-green-400 hover:text-green-300">Forgot password?</Link>
            </div>
            <input
              type="password" name="password" value={formData.password} onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-700" />
          <span className="text-slate-500 text-xs">Or continue with</span>
          <div className="flex-1 border-t border-slate-700" />
        </div>

        <button
          onClick={handleGoogleButtonClick} disabled={googleLoading}
          className="w-full bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-medium py-2.5 px-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="text-center mt-6 text-sm text-slate-500">
          No account?{' '}
          <Link to="/signup" className="text-green-400 hover:text-green-300 font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
