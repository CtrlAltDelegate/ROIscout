import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DataDisclaimer from '../Shared/DataDisclaimer';

const SimpleLandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      console.log('Email submitted:', email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find the best rental markets{' '}
            <span className="text-blue-600">before everyone else.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ROIscout helps real estate investors evaluate markets with zip-level data:
            rental yield, rent-to-price ratio, GRM, and interactive heat maps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-4 rounded-lg border-2 border-blue-600 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Use cases (Launch Readiness plan) */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">📐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Markets that meet the 1% rule</h3>
            <p className="text-gray-600">
              Filter by rent-to-price ratio and gross rental yield to find zip codes where
              monthly rent meets or exceeds 1% of purchase price.
            </p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Compare markets across states</h3>
            <p className="text-gray-600">
              Use the interactive heat map and ROI table to compare median prices, rents, and
              yields across counties and states.
            </p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Save searches and monitor</h3>
            <p className="text-gray-600">
              Save your criteria and revisit anytime. Pro subscribers get email alerts when
              metrics change so you stay ahead of the market.
            </p>
          </div>
        </div>

        {/* About / Credibility */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built by an investor, for investors</h2>
          <p className="text-gray-600 max-w-2xl">
            ROIscout is built with real estate expertise at the core — so the metrics and tools
            match how you actually evaluate markets. Authentic credibility in the investor community.
          </p>
        </div>

        {/* Email signup */}
        <div className="bg-blue-600 rounded-2xl p-8 mt-20 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            New features, market insights, and launch news. No spam.
          </p>
          {!isSubmitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                className="bg-white hover:bg-gray-100 text-blue-600 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg inline-block">
              Thanks for subscribing. We&apos;ll be in touch.
            </div>
          )}
        </div>

        {/* Footer: legal + data disclaimer */}
        <footer className="mt-20 pt-8 border-t border-gray-200 text-center">
          <DataDisclaimer className="max-w-xl mx-auto mb-4" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link to="/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          </div>
          <p className="mt-4 text-gray-500">&copy; 2026 ROIscout. Built for real estate investors.</p>
        </footer>
      </div>
    </div>
  );
};

export default SimpleLandingPage;
