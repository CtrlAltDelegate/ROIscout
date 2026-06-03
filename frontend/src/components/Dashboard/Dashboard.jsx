import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Map, Search, BarChart2, Bookmark, Calculator,
  Info, Compass, Menu, X,
} from 'lucide-react';
import MapboxROIMap from '../Map/MapboxROIMap';
import ROITableView from './ROITableView';
import CashFlowView from './CashFlowView';
import MarketFinder from './MarketFinder';
import SavedSearches from './SavedSearches';
import { apiService } from '../../services/api';

const VALID_TABS = ['map', 'list', 'cashflow', 'finder', 'analytics', 'saved'];

const NAV_ITEMS = [
  { id: 'map',       label: 'ROI Heat Map',    Icon: Map        },
  { id: 'list',      label: 'Search & List',   Icon: Search     },
  { id: 'cashflow',  label: 'Cash Flow',       Icon: Calculator },
  { id: 'finder',   label: 'Find My Market',  Icon: Compass    },
  { id: 'analytics', label: 'Analytics',       Icon: BarChart2  },
  { id: 'saved',     label: 'Saved',           Icon: Bookmark   },
];

const ROIscoutDashboard = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'map';
  });
  const [stats, setStats]                     = useState(null);
  const [isFirstVisit, setIsFirstVisit]       = useState(false);
  const [showSavePrompt, setShowSavePrompt]   = useState(false);
  const [zipViewCount, setZipViewCount]       = useState(0);
  const [analytics, setAnalytics]             = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [savedSearches, setSavedSearches]     = useState([]);
  const [savedLoading, setSavedLoading]       = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(false);

  const userPlan  = user?.subscription_plan || user?.plan || 'free';
  const isAdmin   = !!user?.is_admin;
  const isFree    = userPlan === 'free' && !isAdmin; // admins are always unlimited

  useEffect(() => {
    const hasVisited = localStorage.getItem('roi_scout_visited');
    if (!hasVisited) { setIsFirstVisit(true); localStorage.setItem('roi_scout_visited', 'true'); }
  }, []);

  useEffect(() => {
    apiService.getDashboardStats()
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (activeTab !== 'analytics' || analytics !== null || analyticsLoading) return;
    setAnalyticsLoading(true);
    apiService.getAnalytics()
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab, analytics, analyticsLoading]);

  useEffect(() => {
    if (activeTab !== 'saved' || savedLoading) return;
    setSavedLoading(true);
    apiService.getSavedSearches()
      .then(data => setSavedSearches(data))
      .catch(() => setSavedSearches([]))
      .finally(() => setSavedLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteSavedSearch = useCallback(async (id) => {
    await apiService.deleteSavedSearch(id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleLoadSavedSearch = useCallback((filters) => {
    // Switch to list tab — ROITableView reads filters from URL params
    const params = new URLSearchParams();
    params.set('tab', 'list');
    if (filters.state)        params.set('state', filters.state);
    if (filters.county)       params.set('county', filters.county);
    if (filters.zipCode)      params.set('zipCode', filters.zipCode);
    if (filters.minPrice)     params.set('minPrice', filters.minPrice);
    if (filters.maxPrice)     params.set('maxPrice', filters.maxPrice);
    if (filters.minRent)      params.set('minRent', filters.minRent);
    window.location.search = params.toString();
  }, []);

  const handleNavClick = useCallback((id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  }, []);

  const handleZipViewed = useCallback(() => {
    setZipViewCount(prev => {
      const next = prev + 1;
      if (next >= 3 && isFree && !showSavePrompt) setShowSavePrompt(true);
      return next;
    });
  }, [isFree, showSavePrompt]);

  // ── Yield chart helpers ──────────────────────────────────────────────────────
  const bucketColor = (bucket) => {
    if (bucket === 'Under 4%') return '#94a3b8';
    if (bucket === '4–6%')     return '#60a5fa';
    if (bucket === '6–8%')     return '#34d399';
    if (bucket === '8–10%')    return '#fbbf24';
    if (bucket === '10–12%')   return '#f97316';
    return '#ef4444';
  };

  // ── Tab content ──────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {

      case 'map':
        return (
          <div className="space-y-4">
            {isFirstVisit && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-green-800 text-sm">Welcome to ROIScout</p>
                  <p className="text-xs text-green-600 mt-1 leading-relaxed">
                    This map shows gross yield by zip code — great for a quick scan. For deeper analysis, try these two:
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => { setIsFirstVisit(false); setActiveTab('cashflow'); }}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Cash Flow →
                    </button>
                    <button onClick={() => { setIsFirstVisit(false); setActiveTab('finder'); }}
                      className="text-xs bg-white hover:bg-green-50 text-green-700 border border-green-300 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      Find My Market →
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsFirstVisit(false)} className="text-green-400 hover:text-green-600 ml-4 flex-shrink-0 text-lg leading-none">✕</button>
              </div>
            )}
            {isFree && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Info size={14} className="text-slate-400" />
                  <span><span className="font-semibold">{zipViewCount}/10</span> free zip views used this month</span>
                </span>
                <Link to="/pricing" className="text-green-600 font-medium hover:text-green-700 text-xs">
                  Upgrade for unlimited →
                </Link>
              </div>
            )}
            <MapboxROIMap user={user} onZipViewed={handleZipViewed} />
          </div>
        );

      case 'list':
        return <ROITableView user={user} />;

      case 'cashflow':
        return <CashFlowView user={user} />;

      case 'finder':
        return <MarketFinder user={user} />;

      case 'analytics': {
        return (
          <div className="space-y-5">
            {analyticsLoading && (
              <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
              </div>
            )}

            {!analyticsLoading && analytics && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-slate-800 pb-3 mb-4 border-b border-slate-100">Yield Distribution</h3>
                  <p className="text-xs text-slate-500 mb-5">How many zip codes fall in each gross yield bucket</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.yieldHistogram} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                             tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                      <Tooltip formatter={(v) => [v.toLocaleString(), 'Zip codes']}
                               contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.yieldHistogram.map(e => <Cell key={e.bucket} fill={bucketColor(e.bucket)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {analytics.yieldHistogram.map(b => (
                      <div key={b.bucket} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: bucketColor(b.bucket) }} />
                        {b.bucket}: <span className="font-medium text-slate-700">{b.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-slate-800 pb-3 mb-4 border-b border-slate-100">Top States by Average Yield</h3>
                  <p className="text-xs text-slate-500 mb-5">Average gross rental yield across all tracked zip codes per state</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topStates} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                             tickFormatter={v => `${v}%`} domain={[0, 'dataMax + 1']} />
                      <YAxis type="category" dataKey="state" tick={{ fontSize: 12, fill: '#374151' }}
                             axisLine={false} tickLine={false} width={28} />
                      <Tooltip formatter={(v, n) => n === 'avg_yield' ? [`${v}%`, 'Avg yield'] : [v, n]}
                               contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="avg_yield" radius={[0, 4, 4, 0]} fill="#10b981">
                        {analytics.topStates.map(e => (
                          <Cell key={e.state} fill={e.avg_yield >= 10 ? '#f97316' : e.avg_yield >= 8 ? '#fbbf24' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-400 mt-2">
                    <span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />≥10% &nbsp;
                    <span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />8–10% &nbsp;
                    <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />&lt;8%
                  </p>
                </div>
              </>
            )}

            {!analyticsLoading && !analytics && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                Could not load analytics data. Try refreshing.
              </div>
            )}
          </div>
        );
      }

      case 'saved':
        return savedLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
          </div>
        ) : (
          <SavedSearches
            searches={savedSearches}
            onLoadSearch={handleLoadSavedSearch}
            onDeleteSearch={handleDeleteSavedSearch}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* ── Mobile top bar (hidden on lg+) ──────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between bg-slate-900 px-4 py-3 flex-shrink-0">
        <span className="text-white font-bold text-base tracking-tight">ROIScout</span>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-slate-300 hover:text-white p-1"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Overlay backdrop (mobile only) ────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside
          className={`
            bg-slate-900 flex flex-col flex-shrink-0 overflow-y-auto
            fixed inset-y-0 left-0 z-50 w-[220px] transition-transform duration-200
            lg:static lg:translate-x-0 lg:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile sidebar header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-white font-bold text-base tracking-tight">ROIScout</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-300 hover:text-white p-1"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pt-4 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-slate-800 text-white border-l-2 border-green-400 pl-[10px]'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {id === 'cashflow' && (
                    <span className="ml-auto text-[10px] font-bold bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Data source footnote */}
          <div className="px-4 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 leading-relaxed">
              Data: Zillow ZHVI + ZORI
              {stats?.dataLastUpdated
                ? ` · ${new Date(stats.dataLastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                : ' · Monthly updates'}
            </p>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto">
          {/* Tab body */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Save prompt */}
      {showSavePrompt && isFree && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-2xl p-5 border border-slate-200 max-w-xs z-50">
          <p className="font-semibold text-slate-800 text-sm">Save this search</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Track these markets and get notified when yields change. Available on Basic.
          </p>
          <Link
            to="/pricing"
            className="mt-3 block text-center bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Upgrade to Basic — $19.99/mo
          </Link>
          <button
            onClick={() => setShowSavePrompt(false)}
            className="mt-2 block w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  );
};

export default ROIscoutDashboard;
