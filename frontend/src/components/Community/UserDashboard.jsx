import React, { useState, useEffect } from 'react';
import { 
  User, 
  TrendingUp, 
  Star, 
  Trophy, 
  Target,
  Calendar,
  MapPin,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  Award,
  Activity,
  Heart,
  Search,
  Download
} from 'lucide-react';

const UserDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    // Mock data - in real app, fetch from API
    setUserStats({
      propertiesAnalyzed: 247,
      dealsFound: 12,
      avgROI: 7.8,
      totalSaved: 125000,
      rank: 156,
      level: 'Pro Investor',
      joinDate: '2024-01-15',
      streakDays: 23,
      favoriteCount: 8,
      alertsActive: 3
    });

    setRecentActivity([
      {
        id: 1,
        type: 'property_view',
        title: 'Viewed property in Indianapolis',
        description: '3BR/2BA Single Family - 8.2% ROI',
        timestamp: '2 hours ago',
        icon: MapPin,
        color: 'blue'
      },
      {
        id: 2,
        type: 'deal_found',
        title: 'Found exceptional deal',
        description: 'Kansas City duplex - 9.1% ROI',
        timestamp: '1 day ago',
        icon: TrendingUp,
        color: 'emerald'
      },
      {
        id: 3,
        type: 'alert_triggered',
        title: 'Alert triggered',
        description: 'Nashville High ROI Deals - 2 new properties',
        timestamp: '2 days ago',
        icon: Bell,
        color: 'yellow'
      },
      {
        id: 4,
        type: 'favorite_added',
        title: 'Added to favorites',
        description: 'Atlanta townhouse - 6.8% ROI',
        timestamp: '3 days ago',
        icon: Heart,
        color: 'red'
      },
      {
        id: 5,
        type: 'achievement',
        title: 'Achievement unlocked',
        description: 'Deal Hunter - Found 10+ exceptional deals',
        timestamp: '1 week ago',
        icon: Trophy,
        color: 'purple'
      }
    ]);

    setAchievements([
      {
        id: 1,
        name: 'First Steps',
        description: 'Analyzed your first property',
        icon: Target,
        earned: true,
        earnedDate: '2024-01-15',
        rarity: 'common'
      },
      {
        id: 2,
        name: 'Deal Hunter',
        description: 'Found 10+ exceptional deals (6%+ ROI)',
        icon: Trophy,
        earned: true,
        earnedDate: '2024-01-28',
        rarity: 'rare'
      },
      {
        id: 3,
        name: 'Market Explorer',
        description: 'Analyzed properties in 5+ different markets',
        icon: MapPin,
        earned: true,
        earnedDate: '2024-02-05',
        rarity: 'uncommon'
      },
      {
        id: 4,
        name: 'Streak Master',
        description: 'Used the platform for 30 consecutive days',
        icon: Calendar,
        earned: false,
        progress: 23,
        target: 30,
        rarity: 'rare'
      },
      {
        id: 5,
        name: 'ROI Expert',
        description: 'Found deals with average ROI > 8%',
        icon: BarChart3,
        earned: false,
        progress: 7.8,
        target: 8.0,
        rarity: 'epic'
      },
      {
        id: 6,
        name: 'Community Helper',
        description: 'Helped 10+ other investors',
        icon: User,
        earned: false,
        progress: 3,
        target: 10,
        rarity: 'legendary'
      }
    ]);

    setFavorites([
      {
        id: 1,
        address: '123 Investment St',
        city: 'Indianapolis',
        state: 'IN',
        price: 185000,
        roi: 8.2,
        favorited: '2024-02-10'
      },
      {
        id: 2,
        address: '456 Rental Ave',
        city: 'Kansas City',
        state: 'MO',
        price: 165000,
        roi: 9.1,
        favorited: '2024-02-08'
      }
    ]);

    setSavedSearches([
      {
        id: 1,
        name: 'Indianapolis High ROI',
        filters: { city: 'Indianapolis', minRatio: 7.0 },
        results: 12,
        lastRun: '2024-02-10'
      },
      {
        id: 2,
        name: 'Kansas City Duplexes',
        filters: { city: 'Kansas City', propertyType: 'Multi-Family' },
        results: 8,
        lastRun: '2024-02-09'
      }
    ]);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'activity', name: 'Activity', icon: Activity },
    { id: 'achievements', name: 'Achievements', icon: Award },
    { id: 'favorites', name: 'Favorites', icon: Heart },
    { id: 'searches', name: 'Saved Searches', icon: Search }
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (activity) => {
    const IconComponent = activity.icon;
    return <IconComponent className={`w-4 h-4 text-${activity.color}-600`} />;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'Investor'}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{userStats.level}</span>
                <span>•</span>
                <span>Rank #{userStats.rank}</span>
                <span>•</span>
                <span>Member since {new Date(userStats.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Properties Analyzed</div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{userStats.propertiesAnalyzed}</div>
          <div className="text-sm text-emerald-600">+12 this week</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Deals Found</div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{userStats.dealsFound}</div>
          <div className="text-sm text-gray-600">6%+ ROI properties</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Average ROI</div>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{userStats.avgROI}%</div>
          <div className="text-sm text-emerald-600">Above market avg</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Streak</div>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{userStats.streakDays}</div>
          <div className="text-sm text-gray-600">days active</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${activity.color}-100`}>
                        {getActivityIcon(activity)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.title}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Goal (Properties Analyzed)</span>
                      <span>{userStats.propertiesAnalyzed}/300</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${(userStats.propertiesAnalyzed / 300) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Deals Found This Month</span>
                      <span>{userStats.dealsFound}/15</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(userStats.dealsFound / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg bg-${activity.color}-100`}>
                      {getActivityIcon(activity)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.earned 
                      ? 'border-emerald-200 bg-emerald-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        achievement.earned ? 'bg-emerald-100' : 'bg-gray-200'
                      }`}>
                        <achievement.icon className={`w-5 h-5 ${
                          achievement.earned ? 'text-emerald-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{achievement.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
                        
                        {achievement.earned ? (
                          <div className="text-xs text-emerald-600">
                            Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Favorite Properties</h3>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {favorites.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{property.address}</div>
                      <div className="text-sm text-gray-600">{property.city}, {property.state}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Favorited {new Date(property.favorited).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{property.price.toLocaleString()}</div>
                      <div className="text-sm text-emerald-600">{property.roi}% ROI</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'searches' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Searches</h3>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                  New Search
                </button>
              </div>
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <div key={search.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{search.name}</div>
                      <div className="text-sm text-gray-600">
                        {Object.entries(search.filters).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last run {new Date(search.lastRun).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600">{search.results} results</div>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Run Search</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                <Search className="w-4 h-4 mr-2" />
                New Search
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Bell className="w-4 h-4 mr-2" />
                Create Alert
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
              <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                View Full
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-600">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">InvestorPro</div>
                  <div className="text-xs text-gray-500">342 deals found</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">DealHunter</div>
                  <div className="text-xs text-gray-500">298 deals found</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-emerald-50 p-2 rounded-lg">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600">
                  {userStats.rank}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">You</div>
                  <div className="text-xs text-gray-500">{userStats.dealsFound} deals found</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-gray-700 mb-3">
              Set up email alerts for your target markets to never miss a great deal. Properties with 6%+ ROI get snapped up quickly!
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Create Alert →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
