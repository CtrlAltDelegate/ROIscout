import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import EnhancedROIHeatMap from '../Map/EnhancedROIHeatMap';
import ROITableView from './ROITableView';
import { apiService } from '../../services/api';

const VALID_TABS = ['map', 'list', 'analytics', 'saved'];

const ROIscoutDashboard = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'map';
  });
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [zipViewCount, setZipViewCount] = useState(0);
  const [topMarkets, setTopMarkets] = useState([]);
  const [topMarketsLoading, setTopMarketsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const isFree = userPlan === 'free';

  // First-visit detection
  useEffect(() => {
    const hasVisited = localStorage.getItem('roi_scout_visited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem('roi_scout_visited', 'true');
    }
  }, []);

  // Dashboard stats
  useEffect(() => {
    apiService.getDashboardStats()
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  // Top Markets — national top 10 by yield
  useEffect(() => {
    apiService.getPricingData({ limit: 10 })
      .then(res => setTopMarkets(res.data || []))
      .catch(() => setTopMarkets([]))
      .finally(() => setTopMarketsLoading(false));
  }, []);

  // Analytics — lazy-load when the tab is first opened
  useEffect(() => {
    if (activeTab !== 'analytics' || analytics !== null || analyticsLoading) return;
    setAnalyticsLoading(true);
    apiService.getAnalytics()
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab, analytics, analyticsLoading]);

  // Show save prompt after 3 zip views (for free users)
  const handleZipViewed = useCallback(() => {
    setZipViewCount(prev => {
      const next = prev + 1;
      if (next >= 3 && isFree && !showSavePrompt) setShowSavePrompt(true);
      return next;
    });
  }, [isFree, showSavePrompt]);

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
    switch (activeTab) {
      case 'map':
        return (
          <>
            {/* First-visit welcome banner */}
            {isFirstVisit && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-emerald-800">Welcome to ROI Scout</p>
                  <p className="text-sm text-emerald-600 mt-0.5">
                    Pick a state below to see which zip codes hit the 1% rule — or check the Top Markets panel for the best yields nationwide.
                  </p>
                </div>
                <button
                  onClick={() => setIsFirstVisit(false)}
                  className="text-emerald-400 hover:text-emerald-600 ml-4 flex-shrink-0 text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Free tier usage bar */}
            {isFree && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
                <span className="text-amber-700">
                  <span className="font-semibold">{zipViewCount}/10</span> free zip views used this month
                </span>
                <Link to="/pricing" className="text-amber-700 font-semibold underline hover:text-amber-900">
                  Upgrade for unlimited →
                </Link>
              </div>
            )}

            <EnhancedROIHeatMap user={user} onZipViewed={handleZipViewed} />
          </>
        );
      case 'list':
        return <ROITableView user={user} />;
      case 'analytics': {
        // Colour each yield histogram bar by investment quality
        const bucketColor = (bucket) => {
          if (bucket === 'Under 4%') return '#94a3b8'; // slate
          if (bucket === '4–6%')    return '#60a5fa'; // blue
          if (bucket === '6–8%')    return '#34d399'; // emerald
          if (bucket === '8–10%')   return '#fbbf24'; // amber
          if (bucket === '10–12%')  return '#f97316'; // orange
          return '#ef4444';                            // red (12%+ = rare/risky markets)
        };

        return (
          <div className="space-y-6">
            {/* Summary tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="text-blue-600 text-xs font-semibold uppercase tracking-wide">Avg Gross Yield</div>
                <div className="text-3xl font-bold text-blue-900 mt-1">
                  {stats ? `${stats.avgYield}%` : '—'}
                </div>
                <div className="text-blue-600 text-xs mt-1">Across all tracked zips</div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl">
                <div className="text-emerald-600 text-xs font-semibold uppercase tracking-wide">Exceptional ZIPs ≥10%</div>
                <div className="text-3xl font-bold text-emerald-900 mt-1">
                  {stats ? stats.exceptionalCount.toLocaleString() : '—'}
                </div>
                <div className="text-emerald-600 text-xs mt-1">
                  {stats ? `${((stats.exceptionalCount / stats.totalZips) * 100).toFixed(1)}% of universe` : ''}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="text-purple-600 text-xs font-semibold uppercase tracking-wide">States Covered</div>
                <div className="text-3xl font-bold text-purple-900 mt-1">
                  {stats ? stats.statesCovered : '—'}
                </div>
                <div className="text-purple-600 text-xs mt-1">
                  {stats ? `${stats.totalZips.toLocaleString()} zip codes total` : ''}
                </div>
              </div>
            </div>

            {analyticsLoading && (
              <div className="flex items-center justify-center h-48 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
              </div>
            )}

            {!analyticsLoading && analytics && (
              <>
                {/* Yield distribution histogram */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Yield Distribution</h3>
                  <p className="text-xs text-gray-500 mb-5">How many zip codes fall in each gross yield bucket</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.yieldHistogram} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                             tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                      <Tooltip
                        formatter={(value) => [value.toLocaleString(), 'Zip codes']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.yieldHistogram.map((entry) => (
                          <Cell key={entry.bucket} fill={bucketColor(entry.bucket)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {analytics.yieldHistogram.map(b => (
                      <div key={b.bucket} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: bucketColor(b.bucket) }} />
                        {b.bucket}: <span className="font-medium text-gray-700">{b.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top states by avg yield */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Top States by Average Yield</h3>
                  <p className="text-xs text-gray-500 mb-5">Average gross rental yield across all tracked zip codes per state</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={analytics.topStates}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                             tickFormatter={v => `${v}%`} domain={[0, 'dataMax + 1']} />
                      <YAxis type="category" dataKey="state" tick={{ fontSize: 12, fill: '#374151' }}
                             axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'avg_yield') return [`${value}%`, 'Avg yield'];
                          return [value, name];
                        }}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Bar dataKey="avg_yield" radius={[0, 4, 4, 0]} fill="#10b981">
                        {analytics.topStates.map((entry) => (
                          <Cell
                            key={entry.state}
                            fill={entry.avg_yield >= 10 ? '#f97316' : entry.avg_yield >= 8 ? '#fbbf24' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-400 mt-2">
                    <span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />≥10% &nbsp;
                    <span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />8–10% &nbsp;
                    <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />&lt;8%
                  </p>
                </div>
              </>
            )}

            {!analyticsLoading && !analytics && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                Could not load analytics data. Try refreshing.
              </div>
            )}
          </div>
        );
      }
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

          {/* Top Markets panel */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Markets</h3>
            {topMarketsLoading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : topMarkets.length === 0 ? (
              <div className="text-xs text-gray-400">No data</div>
            ) : (
              <div className="space-y-1.5">
                {topMarkets.slice(0, 8).map((zip, i) => (
                  <div key={zip.zip_code} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 w-4">{i + 1}.</span>
                    <span className="font-medium text-gray-700 flex-1 ml-1">
                      {zip.zip_code} <span className="text-gray-400 font-normal">{zip.state}</span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {parseFloat(zip.gross_rental_yield).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
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

      {/* Save prompt — shown after 3+ zip views for free users */}
      {showSavePrompt && isFree && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-2xl p-5 border border-gray-200 max-w-xs z-50">
          <p className="font-semibold text-gray-800 text-sm">Save this search</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Track these markets and get notified when yields change. Available on Basic.
          </p>
          <Link
            to="/pricing"
            className="mt-3 block text-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Upgrade to Basic — $19.99/mo
          </Link>
          <button
            onClick={() => setShowSavePrompt(false)}
            className="mt-2 block w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  );
};

export default ROIscoutDashboard;
