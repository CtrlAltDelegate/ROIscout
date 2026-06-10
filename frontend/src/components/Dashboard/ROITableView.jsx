import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import FilterPanel from './FilterPanel';
import ROITable from './ROITable';

const FILTER_KEYS = ['state', 'county', 'zipCode', 'minPrice', 'maxPrice', 'minRent', 'propertyType'];

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

const ROITableView = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPro = (user?.subscription_plan || user?.plan) === 'pro' || !!user?.is_admin;

  const [filters, setFilters]                 = useState(() => filtersFromParams(searchParams));
  const [data, setData]                       = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [dataSources, setDataSources]         = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [exporting, setExporting]             = useState(false);
  const [exportError, setExportError]         = useState(null);

  const fetchData = useCallback(async () => {
    if (!filters.state) { setData([]); setDataLastUpdated(null); setDataSources(null); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiService.getPricingData(filters);
      setData(res.data || []);
      setDataLastUpdated(res.dataLastUpdated ?? null);
      setDataSources(res.dataSources ?? null);
    } catch (e) {
      setData([]); setDataLastUpdated(null); setDataSources(null);
      setError(e.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'list');
      FILTER_KEYS.forEach(key => {
        const val = newFilters[key];
        if (val && val !== '3bed2bath') next.set(key, val);
        else if (key === 'propertyType' && val === '3bed2bath') next.delete(key);
        else next.delete(key);
      });
      return next;
    });
  }, [setSearchParams]);

  const handleExportCSV = async () => {
    setExporting(true); setExportError(null);
    try { await apiService.exportCSV(filters); }
    catch (e) { setExportError(e.response?.data?.message || e.message || 'Export failed'); }
    finally { setExporting(false); }
  };

  const handleSaveSearch = async (name) => {
    await apiService.saveSearch({ searchName: name, filters });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">ROI by Zip Code</h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a state to load zip-level yield, rent, and price data.
            </p>
          </div>
          {filters.state && data.length > 0 && (
            <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
              {isPro ? (
                <button
                  onClick={handleExportCSV} disabled={exporting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {exporting
                    ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Exporting…</>
                    : '⬇ Export CSV'}
                </button>
              ) : (
                <a href="/pricing"
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors"
                  title="CSV export is a Pro feature"
                >
                  🔒 Export CSV <span className="text-xs text-blue-600 font-semibold">Pro</span>
                </a>
              )}
              {exportError && <p className="text-red-500 text-xs text-right max-w-xs">{exportError}</p>}
            </div>
          )}
        </div>

        <FilterPanel filters={filters} onFilterChange={handleFilterChange} onSaveSearch={handleSaveSearch} />
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">{error}</div>
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
        {!loading && !error && data.length > 0 && (
          <ROITable data={data} dataLastUpdated={dataLastUpdated} dataSources={dataSources} cashFlowParams={null} />
        )}
      </div>
    </div>
  );
};

export default ROITableView;
