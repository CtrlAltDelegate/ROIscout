import React, { useState } from 'react';

const SimpleLandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log('Email submitted:', email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find Your Next 
            <span className="text-blue-600"> Investment Property</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ROI Scout helps real estate investors discover high-yield rental properties 
            with data-driven insights and market analysis.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a 
              href="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Start Free Trial
            </a>
            <a 
              href="/login" 
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-4 rounded-lg border-2 border-blue-600 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">ROI Heat Map</h3>
            <p className="text-gray-600">
              Visualize investment opportunities with our interactive heat map showing 
              ROI potential across different neighborhoods.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Market Analytics</h3>
            <p className="text-gray-600">
              Get detailed market analysis, rental estimates, and cash flow projections 
              to make informed investment decisions.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Deal Finder</h3>
            <p className="text-gray-600">
              Discover exceptional deals with our advanced filtering system that 
              identifies properties with the highest ROI potential.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
              <div className="text-gray-600">Properties Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">4.8%</div>
              <div className="text-gray-600">Average ROI</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">23</div>
              <div className="text-gray-600">Exceptional Deals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">+12.5%</div>
              <div className="text-gray-600">Market Growth</div>
            </div>
          </div>
        </div>

        {/* Email Signup */}
        <div className="bg-blue-600 rounded-2xl p-8 mt-20 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get notified about new features, market insights, and exceptional deals in your area.
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
              ✅ Thanks for subscribing! We'll be in touch soon.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-gray-600">
          <p>&copy; 2024 ROI Scout. Built for real estate investors.</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLandingPage;
