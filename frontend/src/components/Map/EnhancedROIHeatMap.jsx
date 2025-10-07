import React, { useState, useEffect } from 'react';

// Austin target zip codes - limited to conserve API calls
const AUSTIN_ZIP_CODES = [
  '78701', // Downtown Austin
  '78702', // East Austin
  '78703', // Central Austin
  '78704', // South Austin
  '78705'  // University area
];

const EnhancedROIHeatMap = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    const generateAustinSampleData = () => {
      const properties = [];
      const neighborhoods = {
        '78701': { name: 'Downtown', lat: 30.2672, lng: -97.7431, priceMultiplier: 1.4 },
        '78702': { name: 'East Austin', lat: 30.2588, lng: -97.7197, priceMultiplier: 1.1 },
        '78703': { name: 'Central Austin', lat: 30.2849, lng: -97.7341, priceMultiplier: 1.3 },
        '78704': { name: 'South Austin', lat: 30.2241, lng: -97.7703, priceMultiplier: 1.0 },
        '78705': { name: 'University', lat: 30.2849, lng: -97.7341, priceMultiplier: 0.9 }
      };

      AUSTIN_ZIP_CODES.forEach((zipCode, zipIndex) => {
        const neighborhood = neighborhoods[zipCode];
        
        // Generate 8-12 properties per zip code
        const propertyCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < propertyCount; i++) {
          const basePrice = 250000 + (Math.random() * 200000);
          const listPrice = Math.round(basePrice * neighborhood.priceMultiplier);
          const estimatedRent = Math.round(listPrice * (0.007 + Math.random() * 0.005));
          const roiScore = ((estimatedRent * 12) / listPrice) * 100;
          
          // Add some location variance
          const latVariance = (Math.random() - 0.5) * 0.02;
          const lngVariance = (Math.random() - 0.5) * 0.02;
          
          properties.push({
            id: `${zipCode}-${i}`,
            address: `${1000 + (zipIndex * 100) + i} ${['Oak', 'Elm', 'Main', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} St`,
            city: 'Austin',
            state: 'TX',
            zipCode: zipCode,
            neighborhood: neighborhood.name,
            listPrice: listPrice,
            estimatedRent: estimatedRent,
            roiScore: Math.round(roiScore * 100) / 100,
            latitude: neighborhood.lat + latVariance,
            longitude: neighborhood.lng + lngVariance,
            bedrooms: 2 + Math.floor(Math.random() * 3),
            bathrooms: 1 + Math.floor(Math.random() * 2.5),
            sqft: 800 + Math.floor(Math.random() * 1200),
            propertyType: ['Single Family', 'Condo', 'Townhouse'][Math.floor(Math.random() * 3)]
          });
        }
      });

      return properties.sort((a, b) => b.roiScore - a.roiScore);
    };

    const fetchAustinProperties = async () => {
      setLoading(true);
      try {
        // In production, this would call your backend API
        // For now, generating realistic sample data for Austin
        const sampleProperties = generateAustinSampleData();
        setProperties(sampleProperties);
      } catch (error) {
        console.error('Error fetching Austin properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAustinProperties();
  }, []);

  const getROIColor = (roiScore) => {
    if (roiScore >= 10) return '#059669'; // Excellent - Dark green
    if (roiScore >= 8) return '#10b981';  // Very good - Green
    if (roiScore >= 6) return '#f59e0b';  // Good - Amber
    if (roiScore >= 4) return '#f97316';  // Fair - Orange
    return '#ef4444'; // Poor - Red
  };

  const getROISize = (roiScore) => {
    if (roiScore >= 10) return 28;
    if (roiScore >= 8) return 24;
    if (roiScore >= 6) return 20;
    if (roiScore >= 4) return 16;
    return 12;
  };

  const getROILabel = (roiScore) => {
    if (roiScore >= 10) return 'Exceptional';
    if (roiScore >= 8) return 'Excellent';
    if (roiScore >= 6) return 'Good';
    if (roiScore >= 4) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Austin properties...</span>
        </div>
        <p className="text-sm text-gray-500">Fetching data for {AUSTIN_ZIP_CODES.length} Austin zip codes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🗺️ Austin ROI Heat Map
            </h2>
            <p className="text-blue-100 mt-1">
              {properties.length} properties • {AUSTIN_ZIP_CODES.length} zip codes • API Conservation Mode
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Best ROI</div>
            <div className="text-2xl font-bold">
              {properties.length > 0 ? `${properties[0].roiScore}%` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* API Conservation Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-amber-400 text-xl">⚡</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              <span className="font-semibold">API Conservation Mode:</span> Focused on Austin metro area 
              ({AUSTIN_ZIP_CODES.join(', ')}) to preserve RentCast API quota (50 searches/month).
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              🔄 Refresh Data
            </button>
            <select className="border border-gray-300 rounded-lg px-3 py-2">
              <option>All Zip Codes</option>
              {AUSTIN_ZIP_CODES.map(zip => (
                <option key={zip} value={zip}>{zip}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">ROI Performance Legend</h3>
          <div className="flex flex-wrap items-center gap-4">
            {[
              { min: 10, label: 'Exceptional', color: '#059669' },
              { min: 8, label: 'Excellent', color: '#10b981' },
              { min: 6, label: 'Good', color: '#f59e0b' },
              { min: 4, label: 'Fair', color: '#f97316' },
              { min: 0, label: 'Poor', color: '#ef4444' }
            ].map((tier, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tier.color }}
                ></div>
                <span className="text-sm text-gray-700">
                  {tier.label} ({tier.min === 0 ? '<4' : `${tier.min}+`}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Map Visualization */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6 relative" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map View</h3>
              <p className="text-gray-500 mb-4">
                ROI-based property visualization with dynamic sizing and color coding
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-700">
                  📍 Map integration ready<br/>
                  🎯 Google Maps or Mapbox API<br/>
                  💰 Properties sized by ROI score<br/>
                  🎨 Color-coded performance tiers
                </p>
              </div>
            </div>
          </div>

          {/* Property dots overlay simulation */}
          <div className="absolute inset-0 pointer-events-none">
            {properties.slice(0, 15).map((property, index) => (
              <div
                key={property.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${20 + (index % 5) * 15 + Math.random() * 10}%`,
                  top: `${30 + Math.floor(index / 5) * 20 + Math.random() * 10}%`,
                  width: `${getROISize(property.roiScore)}px`,
                  height: `${getROISize(property.roiScore)}px`,
                  backgroundColor: getROIColor(property.roiScore),
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  pointerEvents: 'auto'
                }}
                onClick={() => setSelectedProperty(property)}
                title={`${property.address} - ${property.roiScore}% ROI`}
              />
            ))}
          </div>
        </div>

        {/* Property Details */}
        {selectedProperty && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getROIColor(selectedProperty.roiScore) }}
                  ></div>
                  {selectedProperty.address}
                </h4>
                <p className="text-gray-600 text-sm">
                  {selectedProperty.neighborhood}, Austin, TX {selectedProperty.zipCode}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <div className="font-semibold">${selectedProperty.listPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Rent:</span>
                    <div className="font-semibold">${selectedProperty.estimatedRent.toLocaleString()}/mo</div>
                  </div>
                  <div>
                    <span className="text-gray-500">ROI:</span>
                    <div className="font-semibold text-green-600">{selectedProperty.roiScore}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <div className="font-semibold">{selectedProperty.propertyType}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Top Performers */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Top ROI Performers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.slice(0, 6).map((property) => (
              <div
                key={property.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedProperty(property)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getROIColor(property.roiScore) }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{property.address}</h4>
                      <p className="text-xs text-gray-500">{property.neighborhood} • {property.zipCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{property.roiScore}%</div>
                    <div className="text-xs text-gray-500">{getROILabel(property.roiScore)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <div className="font-medium">${(property.listPrice / 1000).toFixed(0)}k</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Rent:</span>
                    <div className="font-medium">${property.estimatedRent.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedROIHeatMap;
