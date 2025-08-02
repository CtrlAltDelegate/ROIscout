import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            ROI <span className="text-green-400">Scout</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover high-return real estate markets with data-driven insights. 
            Compare rental yields across neighborhoods and find your next investment opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-green-400 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-3">ROI Analytics</h3>
            <p className="text-gray-300">
              Compare rent-to-price ratios, gross rental yields, and GRM across thousands of zip codes.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-green-400 text-3xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-white mb-3">Interactive Heatmaps</h3>
            <p className="text-gray-300">
              Visualize investment opportunities with color-coded maps showing the best performing areas.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-green-400 text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-3">Market Intelligence</h3>
            <p className="text-gray-300">
              Filter by price range, rental income, and school districts to find your perfect investment.
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Key Investment Metrics
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">8.5%</div>
              <div className="text-gray-300">Average Rental Yield</div>
              <div className="text-sm text-gray-400">Top performing markets</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">12:1</div>
              <div className="text-gray-300">Gross Rent Multiplier</div>
              <div className="text-sm text-gray-400">Optimal investment range</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-gray-300">States Covered</div>
              <div className="text-sm text-gray-400">Nationwide data</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-12">How ROI Scout Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">1</div>
              <h3 className="text-lg font-semibold text-white mb-2">Choose Location</h3>
              <p className="text-gray-400 text-sm">Select state, county, or zip code to analyze</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">2</div>
              <h3 className="text-lg font-semibold text-white mb-2">Set Filters</h3>
              <p className="text-gray-400 text-sm">Apply price range and property criteria</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">3</div>
              <h3 className="text-lg font-semibold text-white mb-2">View Results</h3>
              <p className="text-gray-400 text-sm">See ROI metrics on interactive maps</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">4</div>
              <h3 className="text-lg font-semibold text-white mb-2">Save & Track</h3>
              <p className="text-gray-400 text-sm">Bookmark promising markets for later</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Next Investment?
          </h2>
          <p className="text-green-100 mb-6 text-lg">
            Join hundreds of investors using ROI Scout to identify profitable rental markets.
          </p>
          <Link 
            to="/signup" 
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
