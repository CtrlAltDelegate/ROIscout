import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, DollarSign, Home, Filter, X } from 'lucide-react';

const SimpleROIHeatMap = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Generate sample Austin properties
  useEffect(() => {
    const generateSampleProperties = () => {
      const austinZipCodes = ['78701', '78702', '78703', '78704', '78705'];
      const sampleData = [];
      
      for (let i = 0; i < 20; i++) {
        const listPrice = 200000 + Math.random() * 300000;
        const estimatedRent = listPrice * (0.008 + Math.random() * 0.004);
        const roiScore = ((estimatedRent * 12) / listPrice) * 100;
        
        sampleData.push({
          id: i + 1,
          address: `${1000 + i} Austin St`,
          city: 'Austin',
          state: 'TX',
          zipCode: austinZipCodes[Math.floor(Math.random() * austinZipCodes.length)],
          listPrice: Math.round(listPrice),
          estimatedRent: Math.round(estimatedRent),
          roiScore: Math.round(roiScore * 100) / 100,
          latitude: 30.2672 + (Math.random() - 0.5) * 0.1,
          longitude: -97.7431 + (Math.random() - 0.5) * 0.1,
        });
      }
      
      return sampleData.sort((a, b) => b.roiScore - a.roiScore);
    };

    setTimeout(() => {
      setProperties(generateSampleProperties());
      setLoading(false);
    }, 1000);
  }, []);

  const getROIColor = (roiScore) => {
    if (roiScore >= 8) return 'bg-green-500';
    if (roiScore >= 6) return 'bg-yellow-500';
    if (roiScore >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getROISize = (roiScore) => {
    if (roiScore >= 8) return 'w-6 h-6';
    if (roiScore >= 6) return 'w-5 h-5';
    if (roiScore >= 4) return 'w-4 h-4';
    return 'w-3 h-3';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Austin properties...</span>
        </div>
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
              <MapPin className="w-6 h-6" />
              ROI Heat Map
            </h2>
            <p className="text-blue-100 mt-1">
              {properties.length} Austin properties • API Conservation Mode • v2
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* API Conservation Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>API Conservation Mode:</strong> Focused on Austin, TX to preserve RentCast API calls. 
              <span className="font-medium"> Sample data shown for testing.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Simple Grid View (instead of map) */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Property ROI Visualization</h3>
          <p className="text-sm text-gray-600">Circle size = ROI potential • Color = Performance tier</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <span className="text-sm">Excellent (8%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Good (6-8%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Fair (4-6%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Poor (<4%)</span>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.slice(0, 12).map((property) => (
            <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${getROIColor(property.roiScore)} ${getROISize(property.roiScore)} rounded-full flex-shrink-0`}></div>
                  <div>
                    <h4 className="font-medium text-gray-800">{property.address}</h4>
                    <p className="text-sm text-gray-500">{property.city}, {property.state} {property.zipCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{property.roiScore}%</div>
                  <div className="text-xs text-gray-500">ROI</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">List Price</div>
                  <div className="font-medium">${property.listPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Est. Rent</div>
                  <div className="font-medium">${property.estimatedRent.toLocaleString()}/mo</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more button */}
        <div className="text-center mt-6">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
            Load More Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleROIHeatMap;
