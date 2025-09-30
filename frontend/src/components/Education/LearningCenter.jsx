import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  FileText, 
  Calculator, 
  TrendingUp, 
  Users,
  Clock,
  Star,
  ArrowRight,
  Download,
  ExternalLink
} from 'lucide-react';

const LearningCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Content', icon: BookOpen },
    { id: 'basics', name: 'Basics', icon: FileText },
    { id: 'analysis', name: 'Analysis', icon: Calculator },
    { id: 'strategies', name: 'Strategies', icon: TrendingUp },
    { id: 'case-studies', name: 'Case Studies', icon: Users }
  ];

  const learningContent = [
    {
      id: 1,
      title: "Real Estate Investment Fundamentals",
      category: "basics",
      type: "guide",
      duration: "15 min read",
      difficulty: "Beginner",
      rating: 4.8,
      description: "Complete guide to getting started with real estate investing, covering basic concepts, terminology, and first steps.",
      topics: ["Investment basics", "Property types", "Financing options", "Risk assessment"],
      icon: BookOpen,
      color: "emerald"
    },
    {
      id: 2,
      title: "How to Calculate ROI and Cash Flow",
      category: "analysis",
      type: "tutorial",
      duration: "20 min read",
      difficulty: "Intermediate",
      rating: 4.9,
      description: "Step-by-step tutorial on calculating key investment metrics including ROI, cash flow, cap rates, and more.",
      topics: ["ROI calculation", "Cash flow analysis", "Cap rates", "DSCR"],
      icon: Calculator,
      color: "blue"
    },
    {
      id: 3,
      title: "Market Analysis Masterclass",
      category: "analysis",
      type: "video",
      duration: "45 min watch",
      difficulty: "Advanced",
      rating: 4.7,
      description: "Deep dive into analyzing real estate markets, identifying trends, and spotting opportunities before they become obvious.",
      topics: ["Market indicators", "Demographic analysis", "Economic factors", "Timing strategies"],
      icon: TrendingUp,
      color: "purple"
    },
    {
      id: 4,
      title: "The BRRRR Strategy Explained",
      category: "strategies",
      type: "guide",
      duration: "25 min read",
      difficulty: "Intermediate",
      rating: 4.6,
      description: "Complete breakdown of the Buy, Rehab, Rent, Refinance, Repeat strategy with real examples and implementation tips.",
      topics: ["BRRRR process", "Financing strategies", "Rehab budgeting", "Exit strategies"],
      icon: TrendingUp,
      color: "orange"
    },
    {
      id: 5,
      title: "House Hacking for Beginners",
      category: "strategies",
      type: "guide",
      duration: "18 min read",
      difficulty: "Beginner",
      rating: 4.5,
      description: "Learn how to live for free while building wealth through house hacking strategies and multi-family properties.",
      topics: ["Multi-family properties", "Owner-occupied financing", "Tenant screening", "Property management"],
      icon: Users,
      color: "indigo"
    },
    {
      id: 6,
      title: "Case Study: $50K to $500K Portfolio",
      category: "case-studies",
      type: "case-study",
      duration: "30 min read",
      difficulty: "Intermediate",
      rating: 4.8,
      description: "Real investor's journey from first property to 10-property portfolio, including mistakes, lessons, and strategies.",
      topics: ["Portfolio scaling", "Market selection", "Financing evolution", "Lessons learned"],
      icon: Users,
      color: "green"
    },
    {
      id: 7,
      title: "Understanding Cap Rates and Market Valuation",
      category: "analysis",
      type: "tutorial",
      duration: "22 min read",
      difficulty: "Intermediate",
      rating: 4.7,
      description: "Master cap rates, understand how they vary by market and property type, and use them for investment decisions.",
      topics: ["Cap rate calculation", "Market comparisons", "Risk assessment", "Valuation methods"],
      icon: Calculator,
      color: "blue"
    },
    {
      id: 8,
      title: "Financing Your First Investment Property",
      category: "basics",
      type: "guide",
      duration: "20 min read",
      difficulty: "Beginner",
      rating: 4.6,
      description: "Navigate the financing landscape for investment properties, from conventional loans to creative financing strategies.",
      topics: ["Loan types", "Down payment requirements", "Credit considerations", "Alternative financing"],
      icon: FileText,
      color: "emerald"
    }
  ];

  const tools = [
    {
      name: "ROI Calculator",
      description: "Calculate return on investment for any property",
      icon: Calculator,
      color: "emerald",
      type: "Interactive Tool"
    },
    {
      name: "Cash Flow Analyzer",
      description: "Analyze monthly cash flow and expenses",
      icon: TrendingUp,
      color: "blue",
      type: "Spreadsheet"
    },
    {
      name: "Market Comparison Tool",
      description: "Compare investment metrics across markets",
      icon: FileText,
      color: "purple",
      type: "Interactive Tool"
    },
    {
      name: "Investment Checklist",
      description: "Step-by-step property evaluation checklist",
      icon: BookOpen,
      color: "orange",
      type: "PDF Download"
    }
  ];

  const filteredContent = selectedCategory === 'all' 
    ? learningContent 
    : learningContent.filter(item => item.category === selectedCategory);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return Play;
      case 'tutorial': return Calculator;
      case 'case-study': return Users;
      default: return FileText;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
            <p className="text-gray-600 mt-1">Master real estate investing with our comprehensive guides and tools</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            {filteredContent.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-${item.color}-100`}>
                        <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <TypeIcon className="w-4 h-4" />
                            <span className="capitalize">{item.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{item.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{item.rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                            {item.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.topics.map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button className={`flex items-center space-x-2 text-${item.color}-600 hover:text-${item.color}-700 font-medium`}>
                      <span>
                        {item.type === 'video' ? 'Watch Now' : 'Read Article'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    {item.type !== 'video' && (
                      <button className="text-gray-500 hover:text-gray-700">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Tools</h3>
            <div className="space-y-4">
              {tools.map((tool, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`p-2 rounded-lg bg-${tool.color}-100`}>
                    <tool.icon className={`w-4 h-4 text-${tool.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{tool.name}</div>
                    <div className="text-sm text-gray-600">{tool.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{tool.type}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Featured Content */}
          <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2">New Investor Guide</h3>
            <p className="text-sm opacity-90 mb-4">
              Complete step-by-step guide for your first investment property purchase.
            </p>
            <button className="bg-white text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
              Download Free Guide
            </button>
          </div>

          {/* Popular Topics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Topics</h3>
            <div className="space-y-2">
              {[
                'Cash flow analysis',
                'Market selection',
                'Financing strategies',
                'Property management',
                'Tax implications',
                'Exit strategies'
              ].map((topic, index) => (
                <button key={index} className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 py-1">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningCenter;
