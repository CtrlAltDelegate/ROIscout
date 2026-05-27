import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
          <p className="text-gray-400 mt-2">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-4 rounded mb-6 text-sm leading-relaxed">
              If an account with that email exists, we've sent a password reset link.
              Check your inbox — it may take a minute.
            </div>
            <Link
              to="/login"
              className="text-green-400 hover:text-green-300 text-sm font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-gray-400 hover:text-gray-300 text-sm">
                ← Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
