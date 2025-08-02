import React, { useEffect, useRef, useState } from 'react';

const ROIHeatmap = ({ data }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('gross_rental_yield');
  const [hoveredArea, setHoveredArea] = useState(null);

  // Mock coordinates for demonstration - in production, you'd geocode zip codes
  const getCoordinatesForZip = (zipCode) => {
    // This would normally be a geocoding API call
    const mockCoords = {
      '90210': [-118.4065, 34.0901], // Beverly Hills
      '10001': [-73.9969, 40.7505],  // NYC
      '60601': [-87.6244, 41.8756],  // Chicago
      '78701': [-97.7437, 30.2711],  // Austin
      '33101': [-80.1918, 25.7617]   // Miami
    };
    
    // Generate random coordinates if not in mock data
    const baseCoord = mockCoords[zipCode] || [-95.7129, 37.0902]; // Center of US
    return [
      baseCoord[0] + (Math.random() - 0.5) * 0.1,
      baseCoord[1] + (Math.random() - 0.5) * 0.1
    ];
  };

  const getColorForValue = (value, metric) => {
    if (!value) return '#374151'; // gray-700
    
    let intensity;
    if (metric === 'gross_rental_yield') {
      intensity = Math.min(value / 15, 1); // Cap at 15% yield
    } else if (metric === 'rent_to_price_ratio') {
      intensity = Math.min(value / 1.5, 1); // Cap at 1.5 ratio
    } else if (metric === 'grm') {
      intensity = Math.max(0, 1 - (value / 25)); // Lower GRM is better
    } else {
      intensity = value / Math.max(...data.map(d => d[metric] || 0));
    }
    
    // Color gradient from red (low) to yellow (medium) to green (high)
    if (intensity < 0.5) {
      const r = 255;
      const g = Math.floor(255 * intensity * 2);
      return `rgb(${r}, ${g}, 0)`;
    } else {
      const r = Math.floor(255 * (1 - (intensity - 0.5) * 2));
      const g = 255;
      return `rgb(${r}, ${g}, 0)`;
    }
  };

  const formatMetricValue = (value, metric) => {
    if (!value) return 'N/A';
    
    switch (metric) {
      case 'gross_rental_yield':
        return `${value.toFixed(1)}%`;
      case 'rent_to_price_ratio':
        return value.toFixed(3);
      case 'grm':
        return value.toFixed(1);
      case 'median_price':
        return `${value.toLocaleString()}`;
      case 'median_rent':
        return `${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  const getMetricLabel = (metric) => {
    const labels = {
      'gross_rental_yield': 'Rental Yield',
      'rent_to_price_ratio': 'Rent/Price Ratio',
      'grm': 'Gross Rent Multiplier',
      'median_price': 'Median Price',
      'median_rent': 'Median Rent'
    };
    return labels[metric] || metric;
  };

  // Initialize map (simplified version without actual Mapbox)
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Simulate map loading
    setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
  }, []);

  const handleAreaClick = (area) => {
    setHoveredArea(area);
  };

  const clearSelection = () => {
    setHoveredArea(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">ROI Heatmap</h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="gross_rental_yield">Rental Yield %</option>
          <option value="rent_to_price_ratio">Rent/Price Ratio</option>
          <option value="grm">Gross Rent Multiplier</option>
          <option value="median_price">Median Price</option>
          <option value="median_rent">Median Rent</option>
        </select>
      </div>

      {/* Map Container */}
      <div className="relative h-96">
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-750">
            <div className="text-center">
              <div className="animate-pulse text-gray-400 mb-2">Loading interactive map...</div>
              <div className="text-xs text-gray-500">
                Mapbox integration would load here
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-900 relative overflow-hidden">
            {/* Mock Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            
            {/* Data Points */}
            <div className="absolute inset-0 p-4">
              {data.map((area, index) => {
                const coords = getCoordinatesForZip(area.zip_code);
                const value = area[selectedMetric];
                const color = getColorForValue(value, selectedMetric);
                
                // Position relative to container (mock positioning)
                const x = 50 + (index % 8) * 60; // Spread across width
                const y = 50 + Math.floor(index / 8) * 40; // Spread down height
                
                return (
                  <div
                    key={area.zip_code}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                    style={{
                      left: `${Math.min(x, 90)}%`,
                      top: `${Math.min(y, 85)}%`,
                      backgroundColor: color,
                    }}
                    onClick={() => handleAreaClick(area)}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-600">
                      <div className="font-medium">{area.zip_code}</div>
                      <div>{getMetricLabel(selectedMetric)}: {formatMetricValue(value, selectedMetric)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-600 rounded p-3">
              <div className="text-white text-sm font-medium mb-2">
                {getMetricLabel(selectedMetric)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Low</span>
                <div className="w-20 h-3 rounded" style={{
                  background: 'linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0))'
                }}></div>
                <span className="text-xs text-gray-400">High</span>
              </div>
            </div>

            {/* Click instruction */}
            <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-400">
              Click dots for details
            </div>
          </div>
        )}
      </div>

      {/* Selected Area Info */}
      {hoveredArea && (
        <div className="p-4 border-t border-gray-700 bg-gray-750">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">
              {hoveredArea.zip_code} - {hoveredArea.county}
            </h4>
            <button
              onClick={clearSelection}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Median Price</div>
              <div className="text-white font-medium">
                ${(hoveredArea.median_price || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Monthly Rent</div>
              <div className="text-white font-medium">
                ${(hoveredArea.median_rent || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Rental Yield</div>
              <div className="text-green-400 font-bold">
                {(hoveredArea.gross_rental_yield || 0).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-400">Rent/Price Ratio</div>
              <div className="text-white font-medium">
                {(hoveredArea.rent_to_price_ratio || 0).toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">GRM</div>
              <div className="text-white font-medium">
                {(hoveredArea.grm || 0).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Notice */}
      <div className="px-4 py-2 bg-gray-750 text-xs text-gray-500 border-t border-gray-700">
        📍 Interactive map with Mapbox GL JS would render here in production. 
        Current view shows mock data points for demonstration.
      </div>
    </div>
  );
};

export default ROIHeatmap;
