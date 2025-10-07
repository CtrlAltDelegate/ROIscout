import React, { useState } from 'react';
// Removed lucide-react imports - using emoji icons instead
import EnhancedROIHeatMap from '../Map/EnhancedROIHeatMap';

const ROIscoutDashboard = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [notifications] = useState(3);

  // Mock stats for the dashboard
  const stats = {
    totalProperties: 1247,
    avgRatio: 4.8,
    exceptionalDeals: 23,
    savedSearches: 5,
    marketTrend: '+12.5%'
  };

  // Mock recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'new_deal',
      message: 'New exceptional deal found in Beverly Hills',
      time: '2 hours ago',
      ratio: 6.8
    },
    {
      id: 2,
      type: 'price_drop',
      message: 'Price dropped on saved property in Venice',
      time: '4 hours ago',
      change: '-$25,000'
    },
    {
      id: 3,
      type: 'market_update',
      message: 'Market conditions improved in 90210',
      time: '1 day ago',
      trend: '+5.2%'
    }
  ];

  const getIconEmoji = (id) => {
    const iconMap = {
      'map': '🗺️',
      'list': '📋',
      'analytics': '📊',
      'saved': '⭐'
    };
    return iconMap[id] || '📍';
  };

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => {
        console.log('🔘 Tab button clicked:', id, 'Current active:', activeTab);
        onClick(id);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <span style={{ fontSize: '20px' }}>{getIconEmoji(id)}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  const StatCard = ({ icon, label, value, change, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {change} from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  // Placeholder components for when the actual components aren't imported
  const MapPlaceholder = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mx-auto text-gray-400 mb-4" style={{ fontSize: '64px' }}>🗺️</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">ROI Heat Map</h3>
      <p className="text-gray-500 mb-4">
        Visualize properties with ROI-based sizing and color-coded heat mapping for investment analysis.
      </p>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          🗺️ Component: PropertyMap.jsx<br/>
          📊 Features: Heatmap view, property filters, detailed popups<br/>
          🎯 Status: Ready for integration
        </p>
      </div>
    </div>
  );

  const ListPlaceholder = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mx-auto text-gray-400 mb-4" style={{ fontSize: '64px' }}>📋</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Property Search & List</h3>
      <p className="text-gray-500 mb-4">
        Search, filter, and sort properties with advanced analytics and export capabilities.
      </p>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          📋 Component: PropertyList.jsx<br/>
          🔍 Features: Advanced search, sortable columns, CSV export<br/>
          ⭐ Status: Ready for integration
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    console.log('🎯 Rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'map':
        console.log('🗺️ Loading EnhancedROIHeatMap component...');
        try {
          return <EnhancedROIHeatMap />;
        } catch (error) {
          console.error('❌ Error loading EnhancedROIHeatMap:', error);
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-semibold mb-2">Component Error</h3>
              <p className="text-red-600">Failed to load ROI Heat Map: {error.message}</p>
            </div>
          );
        }
      case 'list':
        return <ListPlaceholder />;
        // return <PropertyList />; // Uncomment when component is imported
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Market Analytics</h3>
            
            {/* Quick metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Average Ratio This Month</div>
                <div className="text-2xl font-bold text-blue-800">{stats.avgRatio}%</div>
                <div className="text-blue-600 text-sm">+0.3% from last month</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Exceptional Deals</div>
                <div className="text-2xl font-bold text-green-800">{stats.exceptionalDeals}</div>
                <div className="text-green-600 text-sm">5 new this week</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">Market Trend</div>
                <div className="text-2xl font-bold text-purple-800">{stats.marketTrend}</div>
                <div className="text-purple-600 text-sm">Improving conditions</div>
              </div>
            </div>

            {/* Chart placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}>📊</div>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">Market Trends Chart</h4>
              <p className="text-gray-500">Price-to-rent ratio trends over time</p>
              <p className="text-sm text-gray-400 mt-2">
                📈 Integration point for Chart.js or Recharts
              </p>
            </div>
          </div>
        );
      case 'saved':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Saved Searches & Favorites</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Saved searches */}
              <div>
                <h4 className="font-medium text-gray-800 mb-4">Saved Searches</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Beverly Hills High Ratio', count: 12, ratio: '5.8%' },
                    { name: 'Venice Beach Under 600k', count: 8, ratio: '4.2%' },
                    { name: 'Santa Monica Condos', count: 15, ratio: '5.1%' }
                  ].map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{search.name}</div>
                        <div className="text-sm text-gray-500">{search.count} properties</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">{search.ratio}</div>
                        <div className="text-xs text-gray-500">Avg ratio</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite properties */}
              <div>
                <h4 className="font-medium text-gray-800 mb-4">Favorite Properties</h4>
                <div className="space-y-3">
                  {[
                    { address: '123 Beverly Hills Dr', price: '$750,000', ratio: '5.6%' },
                    { address: '456 Sunset Blvd', price: '$550,000', ratio: '6.1%' },
                    { address: '789 Hollywood Blvd', price: '$425,000', ratio: '6.2%' }
                  ].map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{property.address}</div>
                        <div className="text-sm text-gray-500">{property.price}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500" style={{ fontSize: '16px' }}>⭐</span>
                        <span className="text-sm font-medium text-green-600">{property.ratio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <MapPlaceholder />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '20px' }}>🏠</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">ROIscout</h1>
            </div>
            
            {/* Global search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '16px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search properties, zip codes, or addresses..."
                className="pl-9 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <span style={{ fontSize: '20px' }}>🔔</span>
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <span style={{ fontSize: '20px' }}>👤</span>
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          {/* Stats overview */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Properties</span>
                <span className="font-semibold text-gray-800">{stats.totalProperties.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg Ratio</span>
                <span className="font-semibold text-green-600">{stats.avgRatio}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Great Deals</span>
                <span className="font-semibold text-yellow-600">{stats.exceptionalDeals}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <TabButton
              id="map"
              label="ROI Heat Map"
              isActive={activeTab === 'map'}
              onClick={setActiveTab}
            />
            <TabButton
              id="list"
              label="Search & List"
              isActive={activeTab === 'list'}
              onClick={setActiveTab}
            />
            <TabButton
              id="analytics"
              label="Analytics"
              isActive={activeTab === 'analytics'}
              onClick={setActiveTab}
            />
            <TabButton
              id="saved"
              label="Saved & Favorites"
              isActive={activeTab === 'saved'}
              onClick={setActiveTab}
            />
          </nav>

          {/* Recent activity */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {activity.message}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    {activity.ratio && (
                      <span className="text-xs font-medium text-green-600">{activity.ratio}%</span>
                    )}
                    {activity.change && (
                      <span className="text-xs font-medium text-blue-600">{activity.change}</span>
                    )}
                    {activity.trend && (
                      <span className="text-xs font-medium text-purple-600">{activity.trend}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Top stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <StatCard
              icon="🏠"
              label="Total Properties"
              value={stats.totalProperties.toLocaleString()}
              change="+127 this week"
              color="blue"
            />
            <StatCard
              icon="📈"
              label="Avg Ratio"
              value={`${stats.avgRatio}%`}
              change="+0.3% this month"
              color="green"
            />
            <StatCard
              icon="🎯"
              label="Exceptional Deals"
              value={stats.exceptionalDeals.toString()}
              change="+5 this week"
              color="yellow"
            />
            <StatCard
              icon="💰"
              label="Market Trend"
              value={stats.marketTrend}
              change="Improving"
              color="purple"
            />
            <StatCard
              icon="⭐"
              label="Saved Searches"
              value={stats.savedSearches.toString()}
              color="blue"
            />
          </div>

          {/* Tab content */}
          <div className="mb-6">
            {renderTabContent()}
          </div>

          {/* Footer info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Last updated: {new Date().toLocaleString()}</span>
                <span>•</span>
                <span>Data sources: RentCast, FRED API, MLS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIscoutDashboard;
