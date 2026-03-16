import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DataDisclaimer from '../Shared/DataDisclaimer';
import LandingHeatmap from './LandingHeatmap';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <div className="container mx-auto px-6 py-16 md:py-20">
        {/* Hero — core message for investors */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Find the best rental markets{' '}
            <span className="text-blue-600">before everyone else.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Built for real estate investors evaluating their next market. Zip-level data, rent-to-price ratios,
            and gross yields so you can spot opportunities and compare markets in minutes — not spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-center shadow-lg shadow-blue-600/25"
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

        {/* Live sample heatmap — real data */}
        <section className="mb-20" aria-label="Live sample heatmap">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">See it in action</h2>
            <p className="text-gray-600 text-center mb-8 max-w-xl mx-auto">
              Real zip-level ROI data below. Green = stronger yield; &quot;1%&quot; = meets the 1% rule. Sign up for the full map and filters.
            </p>
            <LandingHeatmap />
          </div>
        </section>

        {/* Three concrete use-case scenarios */}
        <section className="mb-20" aria-label="Use cases">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How investors use ROI Scout</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-4xl mb-4" aria-hidden="true">📐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Markets that meet the 1% rule</h3>
              <p className="text-gray-600">
                Filter by rent-to-price ratio and gross rental yield to find zip codes where monthly rent
                meets or exceeds 1% of purchase price — so you focus on markets that pencil.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-4xl mb-4" aria-hidden="true">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compare markets across states</h3>
              <p className="text-gray-600">
                Use the interactive heat map and ROI table to compare median prices, rents, and yields
                across counties and states — no more jumping between tabs or manual lookups.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-4xl mb-4" aria-hidden="true">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save searches for ongoing monitoring</h3>
              <p className="text-gray-600">
                Save your criteria and revisit anytime. Pro subscribers get email alerts when metrics change
                so you stay ahead of the market without re-running the same search every week.
              </p>
            </div>
          </div>
        </section>

        {/* About — founder story (credibility asset) */}
        <section className="mb-20" aria-label="About">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ROI Scout is built by an investor, for investors. The metrics and filters — zip-level data,
              the 1% rule, gross rental yield — match how we actually evaluate our next market. No fluff,
              no generic dashboards; just the numbers that matter when you’re comparing opportunities.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I built ROI Scout after spending too much time in spreadsheets and listing sites trying to
              answer one question: where should I look next? Your real estate background is a credibility
              asset — add a line or two here about your experience (e.g. markets you’ve invested in, doors
              you own, or why you built this tool) so visitors know they’re in good hands.
            </p>
          </div>
        </section>

        {/* Email signup */}
        <section className="bg-blue-600 rounded-2xl p-8 md:p-10 text-center text-white max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
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
        </section>

        {/* Footer: legal + data disclaimer */}
        <footer className="mt-20 pt-8 border-t border-gray-200 text-center">
          <DataDisclaimer className="max-w-xl mx-auto mb-4" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link to="/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          </div>
          <p className="mt-4 text-gray-500">&copy; 2026 ROI Scout. Built for real estate investors.</p>
        </footer>
      </div>
    </div>
  );
};

export default SimpleLandingPage;
