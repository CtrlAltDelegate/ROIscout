import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { apiService } from '../../services/api';

const Header = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!user) { setSubscription(null); return; }
    apiService.getSubscription().then((res) => setSubscription(res.subscription || null)).catch(() => setSubscription(null));
  }, [user]);

  const handleLogout = () => { onLogout(); setIsMenuOpen(false); };

  const navLink = (path, label) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={`text-sm font-medium pb-0.5 transition-colors ${
          active
            ? 'text-white border-b-2 border-green-400'
            : 'text-slate-400 hover:text-white border-b-2 border-transparent'
        }`}
      >
        {label}
      </Link>
    );
  };

  const initials = user ? user.email.slice(0, 2).toUpperCase() : '';

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-14 flex items-center flex-shrink-0">
      <div className="w-full px-5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold">
            <span className="text-green-400">ROI</span>
            <span className="text-white">Scout</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/pricing', 'Pricing')}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {initials}
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm text-white font-medium truncate">{user.email}</p>
                      {subscription?.status === 'active' && (
                        <span className="inline-block mt-0.5 text-xs font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                          {subscription.planId === 'pro' ? 'Pro' : 'Basic'}
                        </span>
                      )}
                    </div>
                    <Link
                      to="/pricing"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      {subscription?.status === 'active' ? 'Manage subscription' : 'Upgrade plan'}
                    </Link>
                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
                      >
                        ⚙️ Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-slate-700 mt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {navLink('/pricing', 'Pricing')}
              {navLink('/login', 'Log in')}
              <Link
                to="/signup"
                className="bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-14 inset-x-0 bg-slate-900 border-b border-slate-800 z-40 py-3">
          {user ? (
            <>
              <div className="px-5 py-2 text-xs text-slate-400 border-b border-slate-800 mb-2">
                {user.email}
              </div>
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-5 py-2 text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-5 py-2 text-sm text-slate-300 hover:text-white">Pricing</Link>
              <button onClick={handleLogout} className="block w-full text-left px-5 py-2 text-sm text-slate-400 hover:text-white">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-5 py-2 text-sm text-slate-300 hover:text-white">Pricing</Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-5 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
              <div className="px-5 pt-2">
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block text-center bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">Sign Up</Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />}
    </header>
  );
};

export default Header;
