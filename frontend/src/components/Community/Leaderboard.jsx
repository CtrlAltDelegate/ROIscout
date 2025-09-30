import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Star,
  Crown,
  Zap,
  Filter,
  RefreshCw
} from 'lucide-react';

const Leaderboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('deals');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(false);

  const periods = [
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'quarterly', name: 'This Quarter' },
    { id: 'yearly', name: 'This Year' },
    { id: 'alltime', name: 'All Time' }
  ];

  const categories = [
    { id: 'deals', name: 'Deals Found', icon: Target, description: 'Properties with 6%+ ROI' },
    { id: 'properties', name: 'Properties Analyzed', icon: TrendingUp, description: 'Total properties viewed' },
    { id: 'roi', name: 'Average ROI', icon: Award, description: 'Average ROI of found deals' },
    { id: 'streak', name: 'Activity Streak', icon: Zap, description: 'Consecutive days active' }
  ];

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedPeriod, selectedCategory]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    
    // Mock data - in real app, fetch from API
    setTimeout(() => {
      const mockData = generateMockLeaderboard();
      setLeaderboardData(mockData.leaderboard);
      setUserRank(mockData.userRank);
      setLoading(false);
    }, 800);
  };

  const generateMockLeaderboard = () => {
    const users = [
      { username: 'InvestorPro', level: 'Expert', avatar: '👑' },
      { username: 'DealHunter', level: 'Pro', avatar: '🎯' },
      { username: 'PropertyGuru', level: 'Expert', avatar: '🏆' },
      { username: 'ROIMaster', level: 'Pro', avatar: '💎' },
      { username: 'CashFlowKing', level: 'Advanced', avatar: '💰' },
      { username: 'RealEstateNinja', level: 'Pro', avatar: '🥷' },
      { username: 'MarketAnalyst', level: 'Advanced', avatar: '📊' },
      { username: 'DealMaker', level: 'Pro', avatar: '🤝' },
      { username: 'PropertyScout', level: 'Advanced', avatar: '🔍' },
      { username: 'InvestmentWiz', level: 'Expert', avatar: '🧙‍♂️' },
      { username: 'You', level: 'Pro', avatar: '👤' }
    ];

    const leaderboard = users.slice(0, 10).map((user, index) => {
      let score, change, badge;
      
      switch (selectedCategory) {
        case 'deals':
          score = Math.floor(Math.random() * 200) + 50;
          change = Math.floor(Math.random() * 20) - 10;
          badge = score > 150 ? 'Deal Master' : score > 100 ? 'Deal Hunter' : 'Deal Seeker';
          break;
        case 'properties':
          score = Math.floor(Math.random() * 1000) + 200;
          change = Math.floor(Math.random() * 50) - 25;
          badge = score > 800 ? 'Analysis Expert' : score > 500 ? 'Property Pro' : 'Explorer';
          break;
        case 'roi':
          score = (Math.random() * 5 + 5).toFixed(1);
          change = (Math.random() * 2 - 1).toFixed(1);
          badge = score > 8 ? 'ROI Master' : score > 6 ? 'ROI Pro' : 'ROI Seeker';
          break;
        case 'streak':
          score = Math.floor(Math.random() * 100) + 10;
          change = Math.floor(Math.random() * 10) - 5;
          badge = score > 60 ? 'Streak Legend' : score > 30 ? 'Consistent' : 'Active';
          break;
        default:
          score = Math.floor(Math.random() * 100) + 10;
          change = Math.floor(Math.random() * 10) - 5;
          badge = 'Investor';
      }

      return {
        rank: index + 1,
        username: user.username,
        level: user.level,
        avatar: user.avatar,
        score: score,
        change: change,
        badge: badge,
        isCurrentUser: user.username === 'You'
      };
    });

    // Sort by score
    leaderboard.sort((a, b) => {
      if (selectedCategory === 'roi') {
        return parseFloat(b.score) - parseFloat(a.score);
      }
      return b.score - a.score;
    });

    // Update ranks
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    const userRank = leaderboard.find(u => u.isCurrentUser);

    return { leaderboard, userRank };
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Expert':
        return 'text-purple-600 bg-purple-100';
      case 'Pro':
        return 'text-blue-600 bg-blue-100';
      case 'Advanced':
        return 'text-emerald-600 bg-emerald-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatScore = (score, category) => {
    switch (category) {
      case 'roi':
        return `${score}%`;
      case 'streak':
        return `${score} days`;
      default:
        return score.toLocaleString();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-600 mt-1">See how you rank against other investors</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {categories.find(c => c.id === selectedCategory)?.description}
          </div>
          <button
            onClick={fetchLeaderboardData}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          {/* Top 3 Podium */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Top Performers</h2>
            
            <div className="flex items-end justify-center space-x-4">
              {/* 2nd Place */}
              {leaderboardData[1] && (
                <div className="text-center">
                  <div className="w-20 h-16 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl mb-1">{leaderboardData[1].avatar}</div>
                    <div className="font-semibold text-gray-900">{leaderboardData[1].username}</div>
                    <div className="text-sm text-gray-600">{formatScore(leaderboardData[1].score, selectedCategory)}</div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {leaderboardData[0] && (
                <div className="text-center">
                  <div className="w-24 h-20 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg flex items-end justify-center pb-2 relative">
                    <Crown className="absolute -top-3 w-6 h-6 text-yellow-600" />
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-3xl mb-1">{leaderboardData[0].avatar}</div>
                    <div className="font-bold text-gray-900">{leaderboardData[0].username}</div>
                    <div className="text-sm text-gray-600">{formatScore(leaderboardData[0].score, selectedCategory)}</div>
                    <div className="text-xs text-yellow-600 font-medium mt-1">Champion</div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {leaderboardData[2] && (
                <div className="text-center">
                  <div className="w-20 h-12 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg flex items-end justify-center pb-2">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl mb-1">{leaderboardData[2].avatar}</div>
                    <div className="font-semibold text-gray-900">{leaderboardData[2].username}</div>
                    <div className="text-sm text-gray-600">{formatScore(leaderboardData[2].score, selectedCategory)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {periods.find(p => p.id === selectedPeriod)?.name} Rankings
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {leaderboardData.map((user, index) => (
                  <div key={index} className={`p-4 hover:bg-gray-50 transition-colors ${
                    user.isCurrentUser ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(user.rank)}
                        </div>
                        
                        <div className="text-3xl">{user.avatar}</div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{user.username}</span>
                            {user.isCurrentUser && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(user.level)}`}>
                              {user.level}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {user.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {formatScore(user.score, selectedCategory)}
                        </div>
                        <div className={`text-sm flex items-center justify-end ${
                          user.change > 0 ? 'text-emerald-600' : user.change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {user.change > 0 && '+'}
                          {selectedCategory === 'roi' ? `${user.change}%` : user.change}
                          {user.change !== 0 && (
                            <TrendingUp className={`w-3 h-3 ml-1 ${user.change < 0 ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Your Rank */}
          {userRank && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rank</h3>
              <div className="text-center">
                <div className="text-4xl mb-2">{userRank.avatar}</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getRankBadgeColor(userRank.rank)}`}>
                  #{userRank.rank}
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatScore(userRank.score, selectedCategory)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{userRank.badge}</div>
                </div>
              </div>
            </div>
          )}

          {/* Category Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <category.icon className={`w-5 h-5 ${
                      selectedCategory === category.id ? 'text-yellow-600' : 'text-gray-600'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Preview */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🏆 Climb Higher!</h3>
            <p className="text-sm text-gray-700 mb-3">
              Complete more analyses and find exceptional deals to improve your ranking.
            </p>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View Achievements →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
