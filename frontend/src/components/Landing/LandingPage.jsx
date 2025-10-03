import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  BarChart3, 
  Users, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Target,
  Zap,
  Mail
} from 'lucide-react';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    properties: 0,
    deals: 0,
    users: 0,
    roi: 0
  });

  // Animate stats on load
  useEffect(() => {
    const targets = { properties: 15420, deals: 847, users: 2340, roi: 8.4 };
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        properties: Math.floor(targets.properties * progress),
        deals: Math.floor(targets.deals * progress),
        users: Math.floor(targets.users * progress),
        roi: (targets.roi * progress).toFixed(1)
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(targets);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []); // Empty dependency array is correct - we only want this to run once on mount

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    // TODO: Integrate with email service
    console.log('Email submitted:', email);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 3000);
  };

  const features = [
    {
      icon: MapPin,
      title: "Smart Property Discovery",
      description: "AI-powered search finds hidden gems in emerging markets before they become popular.",
      color: "emerald"
    },
    {
      icon: BarChart3,
      title: "Real-Time ROI Analysis",
      description: "Instant calculations for cap rates, cash flow, and rental yields with live market data.",
      color: "blue"
    },
    {
      icon: TrendingUp,
      title: "Market Trend Insights",
      description: "Identify appreciation patterns and rental demand trends across multiple markets.",
      color: "purple"
    },
    {
      icon: Target,
      title: "Deal Scoring System",
      description: "Proprietary algorithm ranks properties by investment potential and risk factors.",
      color: "orange"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Real Estate Investor",
      image: "/api/placeholder/60/60",
      quote: "ROI Scout helped me find my first investment property in 3 weeks. The data gave me confidence to invest out-of-state.",
      stats: "Built $2M portfolio in 5 years"
    },
    {
      name: "Mike Rodriguez",
      role: "Portfolio Manager",
      image: "/api/placeholder/60/60",
      quote: "The market analysis features are incredible. I've identified 3 emerging neighborhoods before they became hot.",
      stats: "15 properties, $12K/month income"
    },
    {
      name: "Alex Thompson",
      role: "House Hacker",
      image: "/api/placeholder/60/60",
      quote: "Found a fourplex where other tenants pay my mortgage. Living for free while building equity every month.",
      stats: "Living for free + $700/month"
    }
  ];

  const pricingPlans = [
    {
      name: "Explorer",
      price: "Free",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "10 property searches per month",
        "Basic ROI calculations",
        "Market overview data",
        "Email support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro Investor",
      price: "$29",
      period: "per month",
      description: "For serious investors",
      features: [
        "Unlimited property searches",
        "Advanced analytics & trends",
        "Email alerts & notifications",
        "Export to CSV/PDF",
        "Priority support",
        "Market comparison tools"
      ],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "API access",
        "Team collaboration",
        "Custom integrations",
        "Dedicated support",
        "White-label options"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Find Hidden Real Estate Deals with ROIscout
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Discover High-ROI 
                <span className="text-emerald-300"> Investment Properties</span> 
                in Minutes
              </h1>
              
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                Stop spending months analyzing deals manually. Our AI-powered platform finds profitable rental properties 
                with 6%+ returns in emerging markets across the country.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="bg-white text-emerald-700 font-semibold px-8 py-4 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo (2 min)
                </button>
                <button className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-emerald-700 transition-colors">
                  Start Free Analysis
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-300 mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-300 mr-2" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Demo/Stats Section */}
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Live Platform Stats</h3>
                  <p className="text-emerald-200">Updated in real-time</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300">{animatedStats.properties.toLocaleString()}</div>
                    <div className="text-sm text-emerald-200">Properties Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300">{animatedStats.deals}</div>
                    <div className="text-sm text-emerald-200">Deals Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300">{animatedStats.users.toLocaleString()}</div>
                    <div className="text-sm text-emerald-200">Active Investors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300">{animatedStats.roi}%</div>
                    <div className="text-sm text-emerald-200">Avg ROI Found</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-emerald-500 bg-opacity-30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>🔥 Hot Deal Alert:</span>
                    <span className="font-semibold">Indianapolis Duplex - 8.2% ROI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Find Profitable Deals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines real-time market data, AI analysis, and proven investment metrics 
              to help you make confident investment decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${feature.color}-100 text-${feature.color}-600 mb-6 group-hover:bg-${feature.color}-200 transition-colors`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo GIF Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See ROI Scout in Action
            </h2>
            <p className="text-xl text-gray-600">
              Watch how easy it is to find and analyze investment properties
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-800 px-6 py-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-4 text-gray-400 text-sm">roiscout.com</div>
              </div>
              
              {/* Placeholder for demo GIF */}
              <div className="aspect-video bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                    <Play className="w-8 h-8 text-emerald-600 ml-1" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive Demo</h3>
                  <p className="text-gray-600">Click to see the platform in action</p>
                </div>
                
                {/* Simulated UI Elements */}
                <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Indianapolis, IN</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-emerald-600 text-white rounded-lg p-3 shadow-lg">
                  <div className="text-sm font-medium">ROI: 8.2%</div>
                  <div className="text-xs opacity-90">Excellent Deal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Investors
            </h2>
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
              ))}
              <span className="ml-2 text-lg font-medium text-gray-700">4.8/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                
                <blockquote className="text-gray-700 mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="text-sm font-medium text-emerald-600">
                  {testimonial.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Get Early Access to ROI Scout
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join our waitlist and be the first to access our platform when we launch. 
            Plus, get our free "Real Estate Investment Starter Guide" instantly.
          </p>

          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitted}
                className="bg-white text-emerald-700 font-semibold px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Get Early Access
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-sm text-emerald-200 mt-4">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your investment goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-2xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-emerald-500 transform scale-105' : ''}`}>
                {plan.popular && (
                  <div className="bg-emerald-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Free' && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Next Investment Property?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of investors who use ROI Scout to build wealth through real estate.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-8 py-4 rounded-lg transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;