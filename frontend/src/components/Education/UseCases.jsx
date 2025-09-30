import React, { useState } from 'react';
import { 
  User, 
  TrendingUp, 
  Home, 
  DollarSign, 
  Target, 
  BarChart3,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const UseCases = () => {
  const [selectedUseCase, setSelectedUseCase] = useState(0);

  const useCases = [
    {
      title: "The First-Time Investor",
      persona: "Sarah, Marketing Manager",
      background: "28 years old, $75k salary, $50k saved for investment",
      goal: "Build wealth through real estate with minimal time commitment",
      icon: User,
      color: "emerald",
      scenario: {
        challenge: "Sarah wants to invest in real estate but doesn't know where to start or how to analyze deals.",
        solution: "Uses ROI Scout to identify high-yield properties in emerging markets within her budget.",
        process: [
          "Sets filters for properties under $200k with 6%+ rental yields",
          "Analyzes 15 properties in 3 different markets",
          "Identifies a duplex in Indianapolis with 7.2% yield",
          "Purchases property and hires local property management"
        ],
        results: {
          investment: "$180,000 (including down payment and closing costs)",
          monthlyIncome: "$1,080 net cash flow",
          annualReturn: "7.2% cash-on-cash return",
          timeToFind: "3 weeks using ROI Scout vs 6+ months traditional search"
        },
        quote: "ROI Scout helped me find my first investment property in weeks, not months. The data gave me confidence to invest out-of-state."
      }
    },
    {
      title: "The Portfolio Expander",
      persona: "Mike, Real Estate Agent",
      background: "35 years old, owns 3 rental properties, looking to scale",
      goal: "Systematically grow portfolio to 10 properties in 2 years",
      icon: TrendingUp,
      color: "blue",
      scenario: {
        challenge: "Mike needs to efficiently identify and analyze multiple markets to scale his portfolio quickly.",
        solution: "Uses ROI Scout's market analysis tools to identify emerging neighborhoods and undervalued properties.",
        process: [
          "Analyzes market trends across 5 target cities",
          "Identifies neighborhoods with improving fundamentals",
          "Sets up alerts for properties meeting his criteria",
          "Purchases 4 properties in 18 months using data-driven approach"
        ],
        results: {
          investment: "$320,000 total invested across 4 properties",
          monthlyIncome: "$2,400 combined net cash flow",
          annualReturn: "9% average cash-on-cash return",
          portfolioGrowth: "Doubled portfolio size in 18 months"
        },
        quote: "The market analysis features helped me identify emerging areas before they became popular. My portfolio is now generating $2,400/month."
      }
    },
    {
      title: "The House Hacker",
      persona: "Alex, Software Developer",
      background: "26 years old, wants to live for free while building equity",
      goal: "Find a multi-family property to live in one unit, rent others",
      icon: Home,
      color: "purple",
      scenario: {
        challenge: "Alex needs to find a property where rental income from other units covers the mortgage payment.",
        solution: "Uses ROI Scout to find multi-family properties where rent from additional units exceeds mortgage costs.",
        process: [
          "Searches for 2-4 unit properties in commutable distance to work",
          "Analyzes rent potential vs mortgage payments",
          "Identifies a triplex where 2 units cover full mortgage",
          "Lives in one unit while others pay the mortgage"
        ],
        results: {
          investment: "$45,000 down payment on $300k triplex",
          monthlyIncome: "$2,200 rent covers $2,100 mortgage",
          housingCost: "Lives for free + $100/month positive cash flow",
          equityBuilding: "$18,000 annual principal paydown"
        },
        quote: "I found a triplex where the other tenants pay my mortgage. I'm living for free while building equity every month."
      }
    },
    {
      title: "The Market Flipper",
      persona: "Jennifer, Real Estate Investor",
      background: "42 years old, experienced in fix-and-flip, expanding to rentals",
      goal: "Identify markets with strong rental demand and appreciation potential",
      icon: BarChart3,
      color: "orange",
      scenario: {
        challenge: "Jennifer wants to transition from flipping to buy-and-hold but needs to identify the best markets.",
        solution: "Uses ROI Scout's market analytics to find areas with strong fundamentals and cash flow potential.",
        process: [
          "Analyzes population growth, job market, and rental trends",
          "Compares cap rates and appreciation potential across markets",
          "Identifies secondary markets with strong fundamentals",
          "Builds rental portfolio in 3 target markets"
        ],
        results: {
          investment: "$800,000 across 6 properties in 3 markets",
          monthlyIncome: "$4,800 net cash flow",
          annualReturn: "7.2% cash-on-cash + 4% appreciation",
          diversification: "Geographic diversification reduces risk"
        },
        quote: "The market analysis helped me identify secondary markets with better returns than my primary market. My portfolio is now geographically diversified."
      }
    },
    {
      title: "The Retirement Planner",
      persona: "Robert & Linda, Pre-Retirees",
      background: "55 & 52 years old, planning for retirement income",
      goal: "Build passive income stream to supplement retirement",
      icon: Target,
      color: "indigo",
      scenario: {
        challenge: "Need to generate $4,000/month passive income by retirement in 10 years.",
        solution: "Uses ROI Scout to build a portfolio of stable, cash-flowing properties in strong rental markets.",
        process: [
          "Calculates need for 8-10 properties generating $500+ each",
          "Focuses on stable markets with strong rental demand",
          "Prioritizes newer properties requiring minimal maintenance",
          "Builds portfolio systematically over 8 years"
        ],
        results: {
          investment: "$1.2M across 8 properties",
          monthlyIncome: "$4,200 net cash flow at retirement",
          strategy: "Conservative approach with stable, newer properties",
          timeline: "Achieved goal 2 years ahead of schedule"
        },
        quote: "We built a portfolio that generates $4,200/month in passive income. ROI Scout helped us retire comfortably."
      }
    }
  ];

  const currentCase = useCases[selectedUseCase];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real Investor Success Stories</h1>
            <p className="text-gray-600 mt-1">See how different investors use ROI Scout to achieve their goals</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Use Case Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Profiles</h3>
            <div className="space-y-3">
              {useCases.map((useCase, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedUseCase(index)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedUseCase === index
                      ? `bg-${useCase.color}-50 border border-${useCase.color}-200`
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedUseCase === index
                        ? `bg-${useCase.color}-100`
                        : 'bg-gray-100'
                    }`}>
                      <useCase.icon className={`w-5 h-5 ${
                        selectedUseCase === index
                          ? `text-${useCase.color}-600`
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className={`font-medium ${
                        selectedUseCase === index
                          ? `text-${useCase.color}-900`
                          : 'text-gray-900'
                      }`}>
                        {useCase.title}
                      </div>
                      <div className="text-sm text-gray-600">{useCase.persona}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Use Case Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r from-${currentCase.color}-500 to-${currentCase.color}-600 p-6 text-white`}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <currentCase.icon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentCase.title}</h2>
                  <p className="text-lg opacity-90">{currentCase.persona}</p>
                  <p className="text-sm opacity-75 mt-1">{currentCase.background}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Goal */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Investment Goal</h3>
                </div>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{currentCase.goal}</p>
              </div>

              {/* Challenge & Solution */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">The Challenge</h4>
                  <p className="text-gray-700">{currentCase.scenario.challenge}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">ROI Scout Solution</h4>
                  <p className="text-gray-700">{currentCase.scenario.solution}</p>
                </div>
              </div>

              {/* Process */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Step-by-Step Process</h4>
                <div className="space-y-3">
                  {currentCase.scenario.process.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-${currentCase.color}-100 text-${currentCase.color}-600 flex items-center justify-center text-sm font-medium`}>
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Results Achieved</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(currentCase.scenario.results).map(([key, value], index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className={`bg-${currentCase.color}-50 border-l-4 border-${currentCase.color}-400 p-4 rounded-r-lg`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-${currentCase.color}-100 flex items-center justify-center`}>
                      <User className={`w-5 h-5 text-${currentCase.color}-600`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 italic mb-2">"{currentCase.scenario.quote}"</p>
                    <p className="text-sm font-medium text-gray-900">— {currentCase.persona}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Ready to Start Your Investment Journey?</h3>
                <p className="opacity-90">Join thousands of investors using ROI Scout to build wealth through real estate.</p>
              </div>
              <button className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCases;
