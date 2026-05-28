/**
 * MapboxROIMap.jsx — Geographic choropleth map of zip-level rental yields.
 *
 * Requires REACT_APP_MAPBOX_TOKEN in your .env / Netlify env vars.
 * Get a free token at https://mapbox.com (50k loads/month free).
 *
 * Renders each zip code as a color-coded circle on a dark basemap.
 * Circles are sized and colored by gross_rental_yield.
 * Click a circle to see a detail popup.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl';
import { apiService } from '../../services/api';
import DataFreshnessBadge from '../Shared/DataFreshnessBadge';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

// State approximate centre coordinates for fly-to
const STATE_CENTERS = {
  AL:[32.8,-86.8],AK:[64.2,-153],AZ:[34.3,-111.1],AR:[34.8,-92.2],CA:[36.8,-119.4],
  CO:[39,-105.5],CT:[41.6,-72.7],DE:[39,-75.5],FL:[28.7,-82.5],GA:[32.7,-83.4],
  HI:[20.5,-157],ID:[44.4,-114.6],IL:[40,-89.2],IN:[39.9,-86.3],IA:[42,-93.5],
  KS:[38.5,-98.4],KY:[37.8,-85.5],LA:[31,-91.8],ME:[45,-69.2],MD:[39.1,-76.8],
  MA:[42.3,-71.8],MI:[44.3,-85.4],MN:[46.4,-93.1],MS:[32.7,-89.7],MO:[38.5,-92.5],
  MT:[46.9,-110.5],NE:[41.5,-99.9],NV:[39,-117],NH:[44,-71.6],NJ:[40,-74.5],
  NM:[34.5,-106],NY:[42.9,-75.6],NC:[35.5,-79.8],ND:[47.5,-100.5],OH:[40.4,-82.8],
  OK:[35.6,-97],OR:[44,-120.5],PA:[41,-77.2],RI:[41.7,-71.5],SC:[33.9,-81],
  SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31,-100],UT:[39.4,-111.1],VT:[44,-72.7],
  VA:[37.8,-79.5],WA:[47.4,-120.5],WV:[38.7,-80.6],WI:[44.5,-89.6],WY:[43,-107.5],
};

// Yield → Mapbox expression color
const YIELD_COLOR_EXPR = [
  'step', ['get', 'yield'],
  '#ef4444',  // < 4%    red
  4,  '#f97316', // 4-6%   orange
  6,  '#f59e0b', // 6-8%   amber
  8,  '#10b981', // 8-10%  emerald
  10, '#059669', // ≥ 10%  green-700
];

const YIELD_RADIUS_EXPR = [
  'step', ['get', 'yield'],
  4,
  4,  5,
  6,  6,
  8,  8,
  10, 10,
];

// ── No-token screen ───────────────────────────────────────────────────────────
const NoTokenScreen = () => (
  <div className="bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-2xl">🗺️</div>
    <h3 className="text-white font-semibold text-lg mb-2">Mapbox Token Required</h3>
    <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
      The geographic map needs a free Mapbox public token. It takes about 2 minutes to set up.
    </p>
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-left text-xs text-slate-300 space-y-2 max-w-md w-full mb-5">
      <p className="font-semibold text-slate-200">Setup steps:</p>
      <p>1. Sign up free at <a href="https://mapbox.com" target="_blank" rel="noreferrer" className="text-green-400 underline">mapbox.com</a></p>
      <p>2. Copy your <strong>Public Token</strong> from the Tokens page</p>
      <p>3. In Netlify: Site settings → Environment variables → Add <code className="bg-slate-700 px-1 rounded">REACT_APP_MAPBOX_TOKEN</code></p>
      <p>4. Redeploy — the map will render automatically</p>
    </div>
    <p className="text-slate-500 text-xs">Free tier: 50,000 map loads/month — more than enough.</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const MapboxROIMap = ({ user, onZipViewed }) => {
  const [selectedState, setSelectedState]       = useState('TX');
  const [zipData, setZipData]                   = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [popup, setPopup]                       = useState(null); // { lng, lat, zip }
  const [dataLastUpdated, setDataLastUpdated]   = useState(null);
  const [dataSources, setDataSources]           = useState(null);
  const [viewState, setViewState]               = useState({
    longitude: -98, latitude: 39, zoom: 4,
  });
  const mapRef = useRef(null);

  const fetchData = useCallback(async (state) => {
    if (!state) return;
    setLoading(true); setError(null); setPopup(null);
    try {
      const res = await apiService.getPricingData({ state, limit: 500 });
      setZipData(res.data || []);
      setDataLastUpdated(res.dataLastUpdated ?? null);
      setDataSources(res.dataSources ?? null);
    } catch {
      setError('Failed to load data. Try again.');
      setZipData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    fetchData(state);
    // Fly to state
    const center = STATE_CENTERS[state];
    if (center && mapRef.current) {
      mapRef.current.flyTo({ center: [center[1], center[0]], zoom: 6, duration: 1500 });
    }
  };

  // Initial load
  React.useEffect(() => { fetchData('TX'); }, [fetchData]);

  // Fly to state once map is ready
  const handleMapLoad = useCallback(() => {
    const center = STATE_CENTERS['TX'];
    if (center && mapRef.current) {
      mapRef.current.flyTo({ center: [center[1], center[0]], zoom: 5.5, duration: 0 });
    }
  }, []);

  // Build GeoJSON from zip data that has lat/lng
  const geojson = useMemo(() => {
    const features = zipData
      .filter(d => d.lat && d.lng)
      .map(d => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Number(d.lng), Number(d.lat)] },
        properties: {
          zip:    d.zip_code,
          yield:  Number(d.gross_rental_yield) || 0,
          price:  d.median_price,
          rent:   d.median_rent,
          county: d.county || '',
          state:  d.state,
        },
      }));
    return { type: 'FeatureCollection', features };
  }, [zipData]);

  const noCoordinates = zipData.length > 0 && geojson.features.length === 0;
  const pctMapped = zipData.length ? Math.round(geojson.features.length / zipData.length * 100) : 0;

  if (!MAPBOX_TOKEN) return <NoTokenScreen />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-200 bg-white">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">ROI Heat Map</h3>
          <p className="text-xs text-slate-400 mt-0.5">Geographic zip-level yield distribution</p>
        </div>

        <select
          value={selectedState}
          onChange={handleStateChange}
          className="ml-auto border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          {US_STATES.map(s => (
            <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
          ))}
        </select>

        <button
          onClick={() => fetchData(selectedState)}
          disabled={loading}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {loading ? '⟳' : '↻'} Refresh
        </button>

        <DataFreshnessBadge dataLastUpdated={dataLastUpdated} dataSources={dataSources} />
      </div>

      {/* Status strip */}
      {!loading && zipData.length > 0 && (
        <div className="px-5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs text-slate-500">
          <span>{zipData.length.toLocaleString()} zip codes loaded</span>
          <span>·</span>
          <span>{geojson.features.length.toLocaleString()} with coordinates ({pctMapped}%)</span>
          {noCoordinates && (
            <span className="text-amber-600 font-medium">
              · Run <code>node backend/scripts/enrich-census.js</code> to populate coordinates
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-amber-700 text-sm">{error}</div>
      )}

      {/* Map */}
      <div className="relative" style={{ height: 520 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-400 border-t-transparent" />
          </div>
        )}

        <Map
          ref={mapRef}
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          onLoad={handleMapLoad}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          interactiveLayerIds={['zip-circles']}
          onClick={(e) => {
            const feat = e.features?.[0];
            if (!feat) { setPopup(null); return; }
            const [lng, lat] = feat.geometry.coordinates;
            setPopup({ lng, lat, ...feat.properties });
            if (onZipViewed) onZipViewed();
          }}
          cursor="auto"
        >
          <NavigationControl position="top-right" />

          {geojson.features.length > 0 && (
            <Source id="zips" type="geojson" data={geojson}>
              {/* Glow layer */}
              <Layer
                id="zip-glow"
                type="circle"
                paint={{
                  'circle-radius': ['*', YIELD_RADIUS_EXPR, 2.5],
                  'circle-color': YIELD_COLOR_EXPR,
                  'circle-opacity': 0.15,
                  'circle-blur': 1,
                }}
              />
              {/* Main circles */}
              <Layer
                id="zip-circles"
                type="circle"
                paint={{
                  'circle-radius': YIELD_RADIUS_EXPR,
                  'circle-color': YIELD_COLOR_EXPR,
                  'circle-opacity': 0.85,
                  'circle-stroke-width': 0.5,
                  'circle-stroke-color': 'rgba(255,255,255,0.2)',
                }}
              />
            </Source>
          )}

          {/* Popup */}
          {popup && (
            <Popup
              longitude={popup.lng}
              latitude={popup.lat}
              anchor="bottom"
              onClose={() => setPopup(null)}
              closeButton={true}
              className="roi-popup"
            >
              <div className="p-2 min-w-[160px]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">{popup.zip}</span>
                  <span className="text-xs text-slate-500 ml-2">{popup.state}</span>
                </div>
                {popup.county && (
                  <p className="text-xs text-slate-500 mb-2">{popup.county}</p>
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross yield</span>
                    <span className={`font-bold ${popup.yield >= 8 ? 'text-emerald-600' : popup.yield >= 6 ? 'text-amber-600' : 'text-red-500'}`}>
                      {Number(popup.yield).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Median price</span>
                    <span className="font-medium text-slate-800">${Number(popup.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly rent</span>
                    <span className="font-medium text-slate-800">${Number(popup.rent || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Gross yield:</span>
        {[
          { color: '#059669', label: '≥10%' },
          { color: '#10b981', label: '8–10%' },
          { color: '#f59e0b', label: '6–8%' },
          { color: '#f97316', label: '4–6%' },
          { color: '#ef4444', label: '<4%' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-slate-400">Click any dot for details</span>
      </div>
    </div>
  );
};

export default MapboxROIMap;
