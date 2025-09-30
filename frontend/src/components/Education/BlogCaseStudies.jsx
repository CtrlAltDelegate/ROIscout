import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  ArrowRight,
  Tag,
  Eye,
  Share2
} from 'lucide-react';

const BlogCaseStudies = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'case-studies', name: 'Case Studies' },
    { id: 'market-analysis', name: 'Market Analysis' },
    { id: 'strategies', name: 'Strategies' },
    { id: 'tips', name: 'Tips & Guides' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "How I Built a $2M Portfolio in 5 Years Starting with $50K",
      category: "case-studies",
      author: "Sarah Chen",
      date: "2024-01-15",
      readTime: "12 min read",
      views: "2.4K",
      excerpt: "A detailed breakdown of my journey from first-time investor to owning 15 rental properties across 3 markets, including every mistake and lesson learned.",
      image: "/api/placeholder/400/250",
      tags: ["Portfolio Building", "BRRRR", "Market Selection"],
      featured: true,
      metrics: {
        initialInvestment: "$50,000",
        currentValue: "$2,100,000",
        monthlyIncome: "$12,500",
        properties: 15
      }
    },
    {
      id: 2,
      title: "Indianapolis vs Kansas City: A Data-Driven Market Comparison",
      category: "market-analysis",
      author: "Mike Rodriguez",
      date: "2024-01-10",
      readTime: "8 min read",
      views: "1.8K",
      excerpt: "Deep dive analysis comparing two popular investment markets, looking at cap rates, appreciation, rental demand, and economic fundamentals.",
      image: "/api/placeholder/400/250",
      tags: ["Market Analysis", "Indianapolis", "Kansas City"],
      featured: false,
      metrics: {
        avgCapRate: "7.2% vs 6.8%",
        appreciation: "4.1% vs 3.7%",
        vacancyRate: "6% vs 8%",
        priceGrowth: "12% vs 9%"
      }
    },
    {
      id: 3,
      title: "The House Hack That Paid for My MBA",
      category: "case-studies",
      author: "Alex Thompson",
      date: "2024-01-05",
      readTime: "10 min read",
      views: "3.1K",
      excerpt: "How I used a fourplex house hack to live for free during graduate school and built $80K in equity while earning my MBA.",
      image: "/api/placeholder/400/250",
      tags: ["House Hacking", "Student Strategy", "Multi-Family"],
      featured: true,
      metrics: {
        purchasePrice: "$320,000",
        monthlyRent: "$2,800",
        mortgage: "$2,100",
        netCashFlow: "+$700"
      }
    },
    {
      id: 4,
      title: "5 Rookie Mistakes That Cost Me $30K (And How to Avoid Them)",
      category: "tips",
      author: "Jennifer Walsh",
      date: "2023-12-28",
      readTime: "7 min read",
      views: "4.2K",
      excerpt: "Learn from my expensive mistakes in property inspection, market analysis, financing, and property management that cost me thousands.",
      image: "/api/placeholder/400/250",
      tags: ["Beginner Tips", "Mistakes", "Lessons Learned"],
      featured: false,
      metrics: {
        totalLosses: "$30,000",
        inspectionCost: "$8,000",
        marketingError: "$12,000",
        managementIssues: "$10,000"
      }
    },
    {
      id: 5,
      title: "Why I'm Betting Big on Secondary Markets in 2024",
      category: "strategies",
      author: "Robert Kim",
      date: "2023-12-20",
      readTime: "9 min read",
      views: "2.7K",
      excerpt: "Analysis of why secondary markets like Boise, Nashville, and Austin suburbs offer better opportunities than traditional coastal markets.",
      image: "/api/placeholder/400/250",
      tags: ["Market Strategy", "Secondary Markets", "2024 Outlook"],
      featured: false,
      metrics: {
        avgCapRate: "8.5%",
        appreciationPotential: "6-8%",
        entryPrice: "40% lower",
        rentalDemand: "High"
      }
    },
    {
      id: 6,
      title: "From Zero to 10 Properties: The BRRRR Method Breakdown",
      category: "strategies",
      author: "David Park",
      date: "2023-12-15",
      readTime: "15 min read",
      views: "5.1K",
      excerpt: "Complete guide to the BRRRR strategy with real examples, financing details, and step-by-step process for scaling your portfolio.",
      image: "/api/placeholder/400/250",
      tags: ["BRRRR", "Portfolio Scaling", "Refinancing"],
      featured: true,
      metrics: {
        propertiesAcquired: 10,
        totalInvested: "$180,000",
        currentValue: "$1,400,000",
        monthlyIncome: "$8,200"
      }
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Insights</h1>
            <p className="text-gray-600">Real stories, market analysis, and proven strategies from successful investors</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Subscribe to Updates
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Post */}
      {selectedCategory === 'all' && featuredPost && (
        <div className="mb-12">
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl p-8 text-white mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Featured Case Study</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">{featuredPost.title}</h2>
            <p className="text-lg opacity-90 mb-6">{featuredPost.excerpt}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(featuredPost.metrics).map(([key, value], index) => (
                <div key={index} className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-sm opacity-75 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="font-bold text-lg">{value}</div>
                </div>
              ))}
            </div>

            <button className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2">
              <span>Read Full Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="h-48 md:h-full bg-gray-200 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 opacity-80"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl font-bold mb-1">Case Study</div>
                          <div className="text-sm opacity-90">{post.category.replace('-', ' ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.views}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-emerald-600 cursor-pointer">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(post.metrics).slice(0, 4).map(([key, value], index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="font-semibold text-sm text-gray-900">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center space-x-1">
                          <span>Read More</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Newsletter Signup */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Investment Insights</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get the latest case studies, market analysis, and investment strategies delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'BRRRR Strategy',
                  'House Hacking',
                  'Market Analysis',
                  'Cash Flow',
                  'Portfolio Building',
                  'Beginner Tips',
                  'Secondary Markets',
                  'Financing'
                ].map((tag, index) => (
                  <button key={index} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {blogPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="text-xs text-gray-500">
                        {new Date(post.date).toLocaleDateString()} • {post.readTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCaseStudies;
