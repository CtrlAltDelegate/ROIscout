import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // If no token in URL, show an error immediately
  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Set new password</h2>
          <p className="text-gray-400 mt-2">Choose a strong password for your account.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-4 rounded mb-6 text-sm leading-relaxed">
              Password updated successfully! Redirecting you to sign in…
            </div>
            <Link to="/login" className="text-green-400 hover:text-green-300 text-sm font-medium">
              Sign in now →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4 text-sm">
                {error}
                {(error.includes('expired') || error.includes('invalid') || !token) && (
                  <div className="mt-2">
                    <Link to="/forgot-password" className="underline text-red-200 hover:text-white">
                      Request a new reset link
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                  disabled={!token}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  placeholder="Repeat your password"
                  required
                  disabled={!token}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Updating…' : 'Update password'}
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

export default ResetPassword;
