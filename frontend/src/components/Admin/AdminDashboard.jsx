import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const Stat = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className="text-3xl font-bold">{value ?? '—'}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  );
};

const PLAN_COLOR = { free: '#94a3b8', basic: '#3b82f6', pro: '#10b981' };

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiService.getAdminStats()
      .then(setStats)
      .catch(e => setError(e?.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearCache = async () => {
    setClearing(true);
    try {
      await apiService.clearAdminCache();
      setClearMsg('Cache cleared ✓');
      setTimeout(() => setClearMsg(''), 3000);
    } catch {
      setClearMsg('Clear failed');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <p className="text-gray-500 text-sm mb-4">
            Make sure your email is in the <code className="bg-gray-100 px-1 rounded">ADMIN_EMAILS</code> Railway env var.
          </p>
          <Link to="/dashboard" className="text-emerald-600 hover:underline text-sm">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const { users, planBreakdown = [], recentUsers = [], data, subscribers } = stats;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Last refreshed {new Date(stats.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {clearMsg && (
              <span className="text-sm text-emerald-600 font-medium">{clearMsg}</span>
            )}
            <button
              onClick={clearCache}
              disabled={clearing}
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {clearing ? 'Clearing…' : '🗑 Clear cache'}
            </button>
            <button
              onClick={load}
              className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* User metrics */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total users"      value={users.total_users?.toLocaleString()}  color="blue" />
          <Stat label="Paid users"       value={users.paid_users?.toLocaleString()}   color="green"
            sub={users.total_users ? `${((users.paid_users / users.total_users) * 100).toFixed(1)}% conversion` : ''} />
          <Stat label="New (30 days)"    value={users.new_users_30d?.toLocaleString()} color="purple" />
          <Stat label="New (7 days)"     value={users.new_users_7d?.toLocaleString()}  color="amber" />
        </div>

        {/* Plan breakdown + subscribers */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plan breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Plan breakdown</h2>
            <div className="space-y-3">
              {planBreakdown.map(({ plan, count }) => {
                const total = users.total_users || 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize text-gray-800">{plan}</span>
                      <span className="text-gray-500">{count.toLocaleString()} &nbsp;({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: PLAN_COLOR[plan] || '#6366f1' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data + subscribers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Data &amp; reach</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Zip codes in DB</span>
                <span className="font-semibold text-gray-800">{data?.total_zips?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">States covered</span>
                <span className="font-semibold text-gray-800">{data?.states}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last data refresh</span>
                <span className="font-semibold text-gray-800">
                  {data?.last_refresh
                    ? new Date(data.last_refresh).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between text-sm">
                <span className="text-gray-500">Email subscribers</span>
                <span className="font-semibold text-emerald-600">{subscribers?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent signups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent signups</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 ? (
              <div className="p-6 text-sm text-gray-400 text-center">No users yet</div>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{
                        background: (PLAN_COLOR[u.subscription_plan] || '#6366f1') + '20',
                        color: PLAN_COLOR[u.subscription_plan] || '#6366f1',
                      }}
                    >
                      {u.subscription_plan || 'free'}
                    </span>
                    <span className="text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-700">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
