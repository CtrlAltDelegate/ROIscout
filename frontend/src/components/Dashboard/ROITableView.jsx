import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import FilterPanel from './FilterPanel';
import ROITable from './ROITable';
import CashFlowPanel, { DEFAULT_PARAMS } from './CashFlowPanel';

const FILTER_KEYS = ['state', 'county', 'zipCode', 'minPrice', 'maxPrice', 'minRent', 'propertyType'];

/** Read filter values out of URLSearchParams, falling back to defaults. */
function filtersFromParams(params) {
  return {
    state:        params.get('state')        || '',
    county:       params.get('county')       || '',
    zipCode:      params.get('zipCode')      || '',
    minPrice:     params.get('minPrice')     || '',
    maxPrice:     params.get('maxPrice')     || '',
    minRent:      params.get('minRent')      || '',
    propertyType: params.get('propertyType') || '3bed2bath',
  };
}

/**
 * ROI table view: filters + pricing data from API with Data Freshness badge.
 */
const ROITableView = ({ user, defaultCfOpen = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPro = (user?.subscription_plan || user?.plan) === 'pro';

  const [filters, setFilters]           = useState(() => filtersFromParams(searchParams));
  const [data, setData]                 = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [dataSources, setDataSources]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [exporting, setExporting]       = useState(false);
  const [exportError, setExportError]   = useState(null);

  // Cash flow calculator — open by default when launched from CF tab
  const [cfOpen, setCfOpen]             = useState(defaultCfOpen);
  const [cfParams, setCfParams]         = useState(defaultCfOpen ? DEFAULT_PARAMS : null);

  const fetchData = useCallback(async () => {
    if (!filters.state) {
      setData([]);
      setDataLastUpdated(null);
      setDataSources(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getPricingData(filters);
      setData(res.data || []);
      setDataLastUpdated(res.dataLastUpdated ?? null);
      setDataSources(res.dataSources ?? null);
    } catch (e) {
      setData([]);
      setDataLastUpdated(null);
      setDataSources(null);
      setError(e.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'list');
      FILTER_KEYS.forEach(key => {
        const val = newFilters[key];
        if (val && val !== '3bed2bath') {
          next.set(key, val);
        } else if (key === 'propertyType' && val === '3bed2bath') {
          next.delete(key);
        } else {
          next.delete(key);
        }
      });
      return next;
    });
  }, [setSearchParams]);

  const handleExportCSV = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await apiService.exportCSV(filters);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Export failed';
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveSearch = async (name) => {
    try {
      await apiService.saveSearch({ searchName: name, filters });
    } catch (e) {
      console.error('Save search failed', e);
    }
  };

  const toggleCashFlow = () => {
    const opening = !cfOpen;
    setCfOpen(opening);
    if (opening && cfParams === null) {
      // Activate with defaults on first open
      setCfParams(DEFAULT_PARAMS);
    }
    if (!opening) {
      // Closing the panel clears CF mode so table reverts to standard view
      setCfParams(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        {/* Title row */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {defaultCfOpen ? '💰 Cash Flow Analysis' : 'ROI by Zip Code'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {defaultCfOpen
                ? 'Enter your investment parameters below, then select a state to rank markets by cash-on-cash return.'
                : 'Select a state to load zip-level data. The table shows median price, rent, and ROI metrics.'}
            </p>
          </div>

          {/* Right-side action buttons */}
          <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
            {/* Cash Flow Calculator toggle */}
            <button
              onClick={toggleCashFlow}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border ${
                cfOpen
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              💰 Cash Flow Calculator
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${cfOpen ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-200 text-gray-500'}`}>
                {cfOpen ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Export CSV */}
            {filters.state && data.length > 0 && (
              <>
                {isPro ? (
                  <button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {exporting ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                        Exporting…
                      </>
                    ) : (
                      <>⬇ Export CSV</>
                    )}
                  </button>
                ) : (
                  <a
                    href="/pricing"
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors"
                    title="CSV export is a Pro feature"
                  >
                    🔒 Export CSV <span className="text-xs text-blue-600 font-semibold">Pro</span>
                  </a>
                )}
                {exportError && (
                  <p className="text-red-500 text-xs text-right max-w-xs">{exportError}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Standard filter panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onSaveSearch={handleSaveSearch}
        />

        {/* Cash flow panel — shown when toggle is on */}
        {cfOpen && (
          <CashFlowPanel
            params={cfParams}
            onChange={setCfParams}
            activeState={filters.state || null}
          />
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && (!filters.state || data.length === 0) && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-10 text-center">
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-400 text-sm">
              {!filters.state ? 'Select a state above to load ROI data.' : 'No data found for the selected filters.'}
            </p>
          </div>
        )}
        {!loading && !error && data.length > 0 && cfOpen && cfParams && data.length > 0 && (() => {
          const maxPrice = (cfParams.downPct > 0)
            ? (Number(cfParams.downBudget) || 0) / (cfParams.downPct / 100)
            : Infinity;
          const affordableCount = data.filter(r => r.median_price <= maxPrice).length;
          if (affordableCount === 0) {
            return (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-amber-800 text-sm mb-4">
                <strong>No affordable markets found.</strong> Your down payment budget of ${(Number(cfParams.downBudget)||0).toLocaleString()} at {cfParams.downPct}% down
                gives a max price of ${maxPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}, but all zip codes in this state have higher median prices.
                Try increasing your budget or down % in the calculator above.
              </div>
            );
          }
          return null;
        })()}
        {!loading && !error && data.length > 0 && (
          <ROITable
            data={data}
            dataLastUpdated={dataLastUpdated}
            dataSources={dataSources}
            cashFlowParams={cfOpen && cfParams ? cfParams : null}
          />
        )}
      </div>
    </div>
  );
};

export default ROITableView;
