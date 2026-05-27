import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import FilterPanel from './FilterPanel';
import ROITable from './ROITable';

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
 * Displays "Data last updated: [month/year]" and tooltip (Zillow, HUD, Census).
 */
const ROITableView = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPro = (user?.subscription_plan || user?.plan) === 'pro';

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [data, setData] = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [dataSources, setDataSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

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
    // Sync to URL — keep non-filter params (e.g. tab=) intact
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      // Set tab so shared links open directly to the table view
      next.set('tab', 'list');
      FILTER_KEYS.forEach(key => {
        const val = newFilters[key];
        if (val && val !== '3bed2bath') {
          next.set(key, val);
        } else if (key === 'propertyType' && val === '3bed2bath') {
          next.delete(key); // default — omit from URL to keep it clean
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">ROI by Zip Code</h2>
            <p className="text-gray-600 text-sm mt-1">
              Select a state to load zip-level data. The table shows median price, rent, and ROI metrics.
            </p>
          </div>
          {filters.state && data.length > 0 && (
            <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
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
                <p className="text-red-500 text-xs mt-1 text-right max-w-xs">{exportError}</p>
              )}
            </div>
          )}
        </div>
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onSaveSearch={handleSaveSearch}
        />
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
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center text-gray-600">
            {!filters.state
              ? 'Select a state above to load ROI data.'
              : 'No data found for the selected filters.'}
          </div>
        )}
        {!loading && !error && data.length > 0 && (
          <ROITable
            data={data}
            dataLastUpdated={dataLastUpdated}
            dataSources={dataSources}
          />
        )}
      </div>
    </div>
  );
};

export default ROITableView;
