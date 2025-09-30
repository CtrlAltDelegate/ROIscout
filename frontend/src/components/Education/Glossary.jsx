import React, { useState } from 'react';
import { Search, BookOpen, TrendingUp, DollarSign, Home, Calculator } from 'lucide-react';

const Glossary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Terms', icon: BookOpen },
    { id: 'roi', name: 'ROI Metrics', icon: TrendingUp },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'property', name: 'Property Types', icon: Home },
    { id: 'analysis', name: 'Analysis', icon: Calculator }
  ];

  const glossaryTerms = [
    {
      term: "Cap Rate (Capitalization Rate)",
      category: "roi",
      definition: "The rate of return on a real estate investment property based on the income that the property is expected to generate.",
      formula: "Cap Rate = Net Operating Income / Current Market Value",
      example: "A property generating $12,000 annually with a value of $200,000 has a 6% cap rate.",
      importance: "Higher cap rates generally indicate higher returns but may also indicate higher risk."
    },
    {
      term: "Price-to-Rent Ratio",
      category: "roi",
      definition: "A ratio comparing the purchase price of a property to its annual rental income potential.",
      formula: "Price-to-Rent Ratio = Purchase Price / (Monthly Rent × 12)",
      example: "A $300,000 property renting for $2,000/month has a ratio of 12.5.",
      importance: "Lower ratios typically indicate better investment opportunities. Ratios under 15 are generally considered good."
    },
    {
      term: "Gross Rental Yield",
      category: "roi",
      definition: "The annual rental income as a percentage of the property's purchase price, before expenses.",
      formula: "Gross Rental Yield = (Annual Rental Income / Property Price) × 100",
      example: "A $400,000 property earning $32,000/year has an 8% gross rental yield.",
      importance: "Provides a quick comparison tool between properties, though it doesn't account for expenses."
    },
    {
      term: "Net Operating Income (NOI)",
      category: "financial",
      definition: "The total income from a property after deducting operating expenses, but before mortgage payments and taxes.",
      formula: "NOI = Gross Rental Income - Operating Expenses",
      example: "Property earning $30,000 with $8,000 in expenses has NOI of $22,000.",
      importance: "Key metric for determining property profitability and calculating cap rates."
    },
    {
      term: "Cash-on-Cash Return",
      category: "financial",
      definition: "The annual pre-tax cash flow divided by the total cash invested in the property.",
      formula: "Cash-on-Cash Return = Annual Cash Flow / Total Cash Invested",
      example: "Investing $50,000 cash for $4,000 annual cash flow = 8% cash-on-cash return.",
      importance: "Measures the return on actual cash invested, accounting for financing."
    },
    {
      term: "Debt Service Coverage Ratio (DSCR)",
      category: "financial",
      definition: "A measure of the cash flow available to pay current debt obligations.",
      formula: "DSCR = Net Operating Income / Total Debt Service",
      example: "NOI of $25,000 with debt payments of $20,000 = DSCR of 1.25.",
      importance: "Lenders typically require DSCR of 1.2 or higher for investment properties."
    },
    {
      term: "Single-Family Rental (SFR)",
      category: "property",
      definition: "A standalone residential property designed for one family, purchased as an investment to rent out.",
      example: "A 3-bedroom house in a suburban neighborhood rented to a family.",
      importance: "Often easier to manage and finance, with strong tenant demand in many markets."
    },
    {
      term: "Multi-Family Property",
      category: "property",
      definition: "A residential property containing multiple separate housing units, such as duplexes, triplexes, or apartment buildings.",
      example: "A duplex with two 2-bedroom units, each rented separately.",
      importance: "Can provide multiple income streams and economies of scale in management."
    },
    {
      term: "Turnkey Property",
      category: "property",
      definition: "A fully renovated investment property that's ready to rent immediately upon purchase.",
      example: "A recently renovated duplex with tenants already in place.",
      importance: "Reduces initial work and time to cash flow, but typically costs more upfront."
    },
    {
      term: "BRRRR Strategy",
      category: "analysis",
      definition: "Buy, Rehab, Rent, Refinance, Repeat - an investment strategy for building a rental portfolio.",
      example: "Buy a fixer-upper for $100k, rehab for $30k, rent for $1,200/month, refinance at new value.",
      importance: "Allows investors to recycle capital and scale their portfolio faster."
    },
    {
      term: "1% Rule",
      category: "analysis",
      definition: "A quick screening rule suggesting monthly rent should be at least 1% of the purchase price.",
      formula: "Monthly Rent ≥ Purchase Price × 0.01",
      example: "A $200,000 property should rent for at least $2,000/month.",
      importance: "Quick screening tool, though market conditions may make this difficult to achieve."
    },
    {
      term: "Market Rent",
      category: "financial",
      definition: "The rental rate that a property would command in the current market based on comparable properties.",
      example: "Similar 3-bedroom homes in the area rent for $1,800-$2,200/month.",
      importance: "Essential for accurate investment analysis and setting competitive rental rates."
    },
    {
      term: "Appreciation",
      category: "financial",
      definition: "The increase in property value over time due to market conditions, improvements, or inflation.",
      example: "A property bought for $250,000 worth $300,000 five years later shows 20% appreciation.",
      importance: "Provides additional return beyond rental income, though it's not guaranteed."
    },
    {
      term: "Vacancy Rate",
      category: "analysis",
      definition: "The percentage of time a rental property is expected to be vacant in a given period.",
      formula: "Vacancy Rate = (Vacant Days / Total Days) × 100",
      example: "A property vacant 30 days per year has an 8.2% vacancy rate.",
      importance: "Must be factored into cash flow projections and varies by market and property type."
    },
    {
      term: "Operating Expenses",
      category: "financial",
      definition: "The costs required to run and maintain a rental property, excluding mortgage payments.",
      example: "Property taxes, insurance, maintenance, property management, utilities.",
      importance: "Typically 25-50% of gross rental income, varies by property age and type."
    }
  ];

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real Estate Investment Glossary</h1>
            <p className="text-gray-600 mt-1">Essential terms and concepts for property investors</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search terms and definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredTerms.length} of {glossaryTerms.length} terms
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid gap-6">
        {filteredTerms.map((term, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{term.term}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  term.category === 'roi' ? 'bg-emerald-100 text-emerald-800' :
                  term.category === 'financial' ? 'bg-blue-100 text-blue-800' :
                  term.category === 'property' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {categories.find(c => c.id === term.category)?.name || 'General'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Definition</h4>
                <p className="text-gray-700">{term.definition}</p>
              </div>

              {term.formula && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Formula</h4>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-800">
                    {term.formula}
                  </div>
                </div>
              )}

              {term.example && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Example</h4>
                  <p className="text-gray-700 italic">{term.example}</p>
                </div>
              )}

              {term.importance && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Why It Matters</h4>
                  <p className="text-gray-700">{term.importance}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Glossary;
