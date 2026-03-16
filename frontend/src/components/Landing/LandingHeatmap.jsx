import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

/**
 * Live sample heatmap for the landing page: fetches real zip-level ROI data
 * from the API and displays a grid of zip cards colored by gross rental yield.
 * Shows "1% rule" badge when rent-to-price ratio >= 1%.
 */
const DEFAULT_STATE = 'TX';
const MAX_ZIPS = 24;

const getYieldColor = (yieldPct) => {
  if (yieldPct == null) return 'bg-gray-200';
  if (yieldPct >= 8) return 'bg-emerald-600';
  if (yieldPct >= 6) return 'bg-emerald-500';
  if (yieldPct >= 5) return 'bg-green-500';
  if (yieldPct >= 4) return 'bg-amber-500';
  if (yieldPct >= 3) return 'bg-orange-500';
  return 'bg-red-400';
};

const LandingHeatmap = () => {
  const [data, setData] = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSample = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getPricingData({ state: DEFAULT_STATE });
        const rows = (res.data || []).slice(0, MAX_ZIPS);
        if (!cancelled) {
          setData(rows);
          setDataLastUpdated(res.dataLastUpdated ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setData([]);
          setError(e.response?.data?.message || 'Unable to load sample data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSample();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200/60 p-12 text-center">
        <div className="inline-flex items-center justify-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          <span>Loading live zip-level data…</span>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200/60 p-10 text-center">
        <p className="text-gray-600 mb-4">
          {error || 'No zip data loaded yet. Run the data pipeline to see real markets here.'}
        </p>
        <Link
          to="/signup"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Get started to explore markets
        </Link>
      </div>
    );
  }

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Live sample: zip-level ROI</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {data.length} zip codes in {DEFAULT_STATE} • Median price & rent • Gross rental yield
              {dataLastUpdated && (
                <span className="ml-2 text-gray-500">• Data: {formatDate(dataLastUpdated)}</span>
              )}
            </p>
          </div>
          <Link
            to="/signup"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm whitespace-nowrap"
          >
            See full map & filters →
          </Link>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.map((row) => {
            const yieldPct = row.gross_rental_yield != null ? Number(row.gross_rental_yield) : null;
            const ratio = row.rent_to_price_ratio != null ? Number(row.rent_to_price_ratio) : null;
            const meetsOnePercent = ratio != null && ratio >= 0.01;
            return (
              <div
                key={`${row.zip_code}-${row.state}`}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-gray-900">{row.zip_code}</span>
                  {meetsOnePercent && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      1%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate" title={row.county || ''}>
                  {row.county || row.state}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${getYieldColor(yieldPct)}`}
                    title={yieldPct != null ? `${yieldPct}% yield` : 'No yield'}
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    {yieldPct != null ? `${Number(yieldPct).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  ${row.median_price != null ? (row.median_price / 1000).toFixed(0) : '—'}k
                  {' · '}
                  ${row.median_rent ?? '—'}/mo
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Source: Zillow Research, HUD Fair Market Rents, Census. For illustration only; verify before investing.
        </p>
      </div>
    </div>
  );
};

export default LandingHeatmap;
