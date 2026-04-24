import React, { useState, useEffect, useCallback } from 'react';
import DataFreshnessBadge from '../Shared/DataFreshnessBadge';
import { apiService } from '../../services/api';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

const getROIColor = (yield_pct) => {
  if (yield_pct >= 10) return '#059669';
  if (yield_pct >= 8)  return '#10b981';
  if (yield_pct >= 6)  return '#f59e0b';
  if (yield_pct >= 4)  return '#f97316';
  return '#ef4444';
};

const getROISize = (yield_pct) => {
  if (yield_pct >= 10) return 28;
  if (yield_pct >= 8)  return 24;
  if (yield_pct >= 6)  return 20;
  if (yield_pct >= 4)  return 16;
  return 12;
};

const getROILabel = (yield_pct) => {
  if (yield_pct >= 10) return 'Exceptional';
  if (yield_pct >= 8)  return 'Excellent';
  if (yield_pct >= 6)  return 'Good';
  if (yield_pct >= 4)  return 'Fair';
  return 'Poor';
};

const EnhancedROIHeatMap = () => {
  const [selectedState, setSelectedState] = useState('TX');
  const [zipData, setZipData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedZip, setSelectedZip] = useState(null);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);

  const fetchData = useCallback(async (state) => {
    if (!state) return;
    setLoading(true);
    setError(null);
    setSelectedZip(null);
    try {
      const response = await apiService.getPricingData({ state, limit: 100 });
      setZipData(response.data || []);
      setDataLastUpdated(response.dataLastUpdated);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      setZipData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedState);
  }, [selectedState, fetchData]);

  useEffect(() => {
    apiService.recordMapLoad().catch(() => {});
  }, []);

  const topPerformers = [...zipData]
    .sort((a, b) => parseFloat(b.gross_rental_yield) - parseFloat(a.gross_rental_yield))
    .slice(0, 20);

  const bestYield = topPerformers[0] ? parseFloat(topPerformers[0].gross_rental_yield).toFixed(1) : '--';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">ROI Market Map</h2>
            <p className="text-blue-100 mt-1">
              {loading ? 'Loading...' : `${zipData.length} zip codes • ${selectedState}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Best Yield</div>
            <div className="text-2xl font-bold">{loading ? '...' : `${bestYield}%`}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => fetchData(selectedState)}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <DataFreshnessBadge
            dataLastUpdated={dataLastUpdated}
            dataSources="Zillow Research, HUD Fair Market Rents, Census Bureau. Updated monthly."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Gross Rental Yield</h3>
          <div className="flex flex-wrap items-center gap-4">
            {[
              { min: 10, label: 'Exceptional', color: '#059669' },
              { min: 8,  label: 'Excellent',   color: '#10b981' },
              { min: 6,  label: 'Good',         color: '#f59e0b' },
              { min: 4,  label: 'Fair',         color: '#f97316' },
              { min: 0,  label: 'Poor',         color: '#ef4444' },
            ].map((tier) => (
              <div key={tier.min} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                <span className="text-xs text-gray-700">
                  {tier.label} ({tier.min === 0 ? '<4' : `${tier.min}+`}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual scatter plot */}
        <div className="bg-gray-100 rounded-lg mb-6 relative overflow-hidden" style={{ height: '320px' }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                <span>Loading {selectedState} market data...</span>
              </div>
            </div>
          ) : zipData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              No data available for {selectedState}
            </div>
          ) : (
            <>
              <div className="absolute top-3 left-3 text-xs text-gray-400">
                Yield % (bubble size = yield, color = tier) — {topPerformers.length} top zip codes shown
              </div>
              {topPerformers.map((row, index) => {
                const yield_pct = parseFloat(row.gross_rental_yield);
                const size = getROISize(yield_pct);
                // Spread bubbles across the area based on yield and index
                const x = 8 + (index % 10) * 9;
                const y = 20 + Math.floor(index / 10) * 45 + (yield_pct % 3) * 5;
                return (
                  <div
                    key={row.zip_code}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      backgroundColor: getROIColor(yield_pct),
                      borderRadius: '50%',
                      border: selectedZip?.zip_code === row.zip_code ? '3px solid #1d4ed8' : '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                    onClick={() => setSelectedZip(row)}
                    title={`${row.zip_code} — ${yield_pct.toFixed(1)}% yield`}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Selected zip detail */}
        {selectedZip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getROIColor(parseFloat(selectedZip.gross_rental_yield)) }}
                  />
                  ZIP {selectedZip.zip_code} — {selectedZip.county || selectedZip.state}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Median Price</span>
                    <div className="font-semibold">${Number(selectedZip.median_price).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Median Rent</span>
                    <div className="font-semibold">${Number(selectedZip.median_rent).toLocaleString()}/mo</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Gross Yield</span>
                    <div className="font-semibold text-green-600">
                      {parseFloat(selectedZip.gross_rental_yield).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">GRM</span>
                    <div className="font-semibold">{parseFloat(selectedZip.grm).toFixed(1)}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedZip(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
          </div>
        )}

        {/* Top performers table */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Top Zip Codes by Yield — {selectedState}</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : topPerformers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No data found for {selectedState}. Try another state.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformers.slice(0, 9).map((row) => {
                const yield_pct = parseFloat(row.gross_rental_yield);
                return (
                  <div
                    key={row.zip_code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedZip(row)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getROIColor(yield_pct) }} />
                        <div>
                          <h4 className="font-medium text-gray-800">ZIP {row.zip_code}</h4>
                          <p className="text-xs text-gray-500">{row.county || row.state}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{yield_pct.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">{getROILabel(yield_pct)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400">Price: </span>
                        <span className="font-medium">${(Number(row.median_price) / 1000).toFixed(0)}k</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rent: </span>
                        <span className="font-medium">${Number(row.median_rent).toLocaleString()}/mo</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedROIHeatMap;
