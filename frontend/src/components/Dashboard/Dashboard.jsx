import React, { useState, useEffect } from 'react';
import EnhancedROIHeatMap from '../Map/EnhancedROIHeatMap';
import ROITableView from './ROITableView';
import { apiService } from '../../services/api';

const ROIscoutDashboard = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    apiService.getDashboardStats()
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

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


  const renderTabContent = () => {
    console.log('🎯 Rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'map':
        console.log('🗺️ Loading EnhancedROIHeatMap component...');
        return <EnhancedROIHeatMap />;
      case 'list':
        return <ROITableView />;
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Market Analytics</h3>
            
            {/* Quick metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Avg Gross Yield</div>
                <div className="text-2xl font-bold text-blue-800">
                  {stats ? `${stats.avgYield}%` : '—'}
                </div>
                <div className="text-blue-600 text-sm">Across all tracked zips</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Exceptional ZIPs (≥10%)</div>
                <div className="text-2xl font-bold text-green-800">
                  {stats ? stats.exceptionalCount.toLocaleString() : '—'}
                </div>
                <div className="text-green-600 text-sm">
                  {stats ? `${((stats.exceptionalCount / stats.totalZips) * 100).toFixed(1)}% of tracked zips` : ''}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">States Covered</div>
                <div className="text-2xl font-bold text-purple-800">
                  {stats ? stats.statesCovered : '—'}
                </div>
                <div className="text-purple-600 text-sm">
                  {stats ? `${stats.totalZips.toLocaleString()} zip codes total` : ''}
                </div>
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
            {statsLoading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Zip Codes</span>
                  <span className="font-semibold text-gray-800">{stats.totalZips.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Yield</span>
                  <span className="font-semibold text-green-600">{stats.avgYield}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">High-Yield ZIPs</span>
                  <span className="font-semibold text-yellow-600">{stats.excellentCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">States</span>
                  <span className="font-semibold text-blue-600">{stats.statesCovered}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">Unavailable</div>
            )}
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

          {/* Data info */}
          <div className="mt-8 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-semibold text-blue-700 mb-1">Data Sources</div>
            <div className="text-xs text-blue-600">Zillow ZHVI & ZORI</div>
            <div className="text-xs text-blue-500 mt-1">
              {stats?.dataLastUpdated
                ? `Updated ${new Date(stats.dataLastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                : 'Monthly updates'}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Top stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              icon="🗺️"
              label="Zip Codes Tracked"
              value={statsLoading ? '...' : stats ? stats.totalZips.toLocaleString() : '—'}
              change={stats ? `${stats.statesCovered} states` : null}
              color="blue"
            />
            <StatCard
              icon="📈"
              label="Avg Gross Yield"
              value={statsLoading ? '...' : stats ? `${stats.avgYield}%` : '—'}
              color="green"
            />
            <StatCard
              icon="🎯"
              label="Exceptional ZIPs (≥10%)"
              value={statsLoading ? '...' : stats ? stats.exceptionalCount.toLocaleString() : '—'}
              color="yellow"
            />
            <StatCard
              icon="✅"
              label="High-Yield ZIPs (≥8%)"
              value={statsLoading ? '...' : stats ? stats.excellentCount.toLocaleString() : '—'}
              color="purple"
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
                <span>
                  {stats?.dataLastUpdated
                    ? `Data updated: ${new Date(stats.dataLastUpdated).toLocaleDateString()}`
                    : 'Data sources: Zillow Research'}
                </span>
                <span>•</span>
                <span>Zillow ZHVI &amp; ZORI · HUD Fair Market Rents · Census Bureau</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIscoutDashboard;
