import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const FilterPanel = ({ filters, onFilterChange, onSaveSearch }) => {
  const [states, setStates]               = useState([]);
  const [counties, setCounties]           = useState([]);
  const [zipCodes, setZipCodes]           = useState([]);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [linkCopied, setLinkCopied]       = useState(false);

  useEffect(() => { loadStates(); }, []);

  useEffect(() => {
    if (filters.state) loadCounties(filters.state);
    else { setCounties([]); setZipCodes([]); }
  }, [filters.state]);

  useEffect(() => {
    if (filters.county) loadZipCodes(filters.county);
    else setZipCodes([]);
  }, [filters.county]);

  const loadStates    = async () => { try { const r = await apiService.getStates();   setStates(r.data || []);   } catch {} };
  const loadCounties  = async (s) => { try { const r = await apiService.getCounties(s); setCounties(r.data || []); } catch {} };
  const loadZipCodes  = async (c) => { try { const r = await apiService.getZipCodes(c); setZipCodes(r.data || []); } catch {} };

  const handleFilterChange = (field, value) => {
    const next = { ...filters, [field]: value };
    if (field === 'state')  { next.county = ''; next.zipCode = ''; }
    if (field === 'county') { next.zipCode = ''; }
    onFilterChange(next);
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Failed to save — try a different name.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareView = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const clearFilters = () => {
    onFilterChange({ state: '', county: '', zipCode: '', minPrice: '', maxPrice: '', minRent: '', propertyType: '3bed2bath' });
  };

  const inputCls = "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Search Filters</h2>
        <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* Property Type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Property Type</label>
          <select value={filters.propertyType} onChange={e => handleFilterChange('propertyType', e.target.value)} className={inputCls}>
            <option value="3bed2bath">3 Bed / 2 Bath</option>
            <option value="2bed2bath">2 Bed / 2 Bath</option>
            <option value="4bed3bath">4 Bed / 3 Bath</option>
            <option value="1bed1bath">1 Bed / 1 Bath</option>
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">State</label>
          <select value={filters.state} onChange={e => handleFilterChange('state', e.target.value)} className={inputCls}>
            <option value="">Select State</option>
            {states.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          </select>
        </div>

        {/* County */}
        {filters.state && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">County <span className="text-slate-300">(optional)</span></label>
            <select value={filters.county} onChange={e => handleFilterChange('county', e.target.value)} className={inputCls}>
              <option value="">All Counties</option>
              {counties.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Zip Code */}
        {filters.county && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Zip Code <span className="text-slate-300">(optional)</span></label>
            <select value={filters.zipCode} onChange={e => handleFilterChange('zipCode', e.target.value)} className={inputCls}>
              <option value="">All Zip Codes</option>
              {zipCodes.map(z => <option key={z.code} value={z.code}>{z.code}</option>)}
            </select>
          </div>
        )}

        {/* Min Price */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Min Price</label>
          <input type="number" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)} placeholder="$0" className={inputCls} />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Max Price</label>
          <input type="number" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)} placeholder="No limit" className={inputCls} />
        </div>

        {/* Min Rent */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Min Monthly Rent</label>
          <input type="number" value={filters.minRent} onChange={e => handleFilterChange('minRent', e.target.value)} placeholder="$0" className={inputCls} />
        </div>
      </div>

      {/* Save / Share */}
      {filters.state && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={() => { setShowSaveModal(true); setSaveError(''); }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            💾 Save Search
          </button>
          <button
            onClick={handleShareView}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              linkCopied
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            {linkCopied ? '✓ Copied!' : '🔗 Share'}
          </button>
          {saveSuccess && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              ✓ Search saved
            </span>
          )}
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={e => setSaveSearchName(e.target.value)}
              placeholder="Enter search name…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveSearch()}
            />
            {saveError && (
              <p className="text-red-500 text-xs mb-3 -mt-1">{saveError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveSearch}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setShowSaveModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
