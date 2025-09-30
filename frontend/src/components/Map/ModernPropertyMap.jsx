import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Filter, 
  X, 
  Search,
  Layers,
  Target,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';

const ModernPropertyMap = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({
    zipCode: '',
    minPrice: '',
    maxPrice: '',
    minRatio: '',
    propertyType: '',
    bedroomsMin: ''
  });
  const [viewMode, setViewMode] = useState('heatmap');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [mapStyle, setMapStyle] = useState('modern');

  // Fetch properties from API
  const fetchProperties = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const params = new URLSearchParams();
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key]) {
          params.append(key, searchFilters[key]);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/properties?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const propertiesData = data.properties || data.data || [];
      
      const transformedProperties = propertiesData.map(prop => ({
        id: prop.id,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zipCode: prop.zip_code,
        lat: prop.latitude,
        lng: prop.longitude,
        listPrice: prop.list_price,
        estimatedRent: prop.estimated_rent,
        priceToRentRatio: prop.price_to_rent_ratio,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        squareFeet: prop.square_feet,
        propertyType: prop.property_type,
        capRate: prop.cap_rate,
        ratioVsMarket: ((prop.price_to_rent_ratio - 4.5) / 4.5 * 100).toFixed(1)
      }));
      
      setProperties(transformedProperties);
      setFilteredProperties(transformedProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(filters);
  }, []);

  // Filter properties
  useEffect(() => {
    let filtered = properties.filter(property => {
      if (filters.zipCode && !property.zipCode.includes(filters.zipCode)) return false;
      if (filters.minPrice && property.listPrice < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && property.listPrice > parseInt(filters.maxPrice)) return false;
      if (filters.minRatio && property.priceToRentRatio < parseFloat(filters.minRatio)) return false;
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      if (filters.bedroomsMin && property.bedrooms < parseInt(filters.bedroomsMin)) return false;
      return true;
    });
    setFilteredProperties(filtered);
  }, [filters, properties]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      zipCode: '',
      minPrice: '',
      maxPrice: '',
      minRatio: '',
      propertyType: '',
      bedroomsMin: ''
    });
  };

  const getRatioColor = (ratio) => {
    if (ratio >= 6.0) return 'bg-emerald-500';
    if (ratio >= 4.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatioColorClass = (ratio) => {
    if (ratio >= 6.0) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (ratio >= 4.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading property data...</div>
            <div className="text-sm text-gray-400 mt-1">Analyzing investment opportunities</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Investment Map</h2>
              <p className="text-sm text-gray-500">
                {filteredProperties.length} properties • {filteredProperties.filter(p => p.priceToRentRatio >= 6.0).length} exceptional deals
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'heatmap' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-4 h-4 mr-1 inline" />
                Heatmap
              </button>
              <button
                onClick={() => setViewMode('markers')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'markers' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-4 h-4 mr-1 inline" />
                Markers
              </button>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showFilters 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filter Properties</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  placeholder="90210"
                  value={filters.zipCode}
                  onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="500000"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Ratio %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.0"
                  value={filters.minRatio}
                  onChange={(e) => handleFilterChange('minRatio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="Single Family">Single Family</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Multi-Family">Multi-Family</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
                <select
                  value={filters.bedroomsMin}
                  onChange={(e) => handleFilterChange('bedroomsMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative h-96 bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 opacity-60"></div>
        
        {/* Property Visualization */}
        <div className="relative h-full p-6">
          {viewMode === 'heatmap' ? (
            // Modern Heatmap View
            <div className="grid grid-cols-4 gap-4 h-full">
              {filteredProperties.slice(0, 12).map((property, index) => (
                <div
                  key={property.id}
                  className={`relative rounded-xl opacity-90 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${getRatioColor(property.priceToRentRatio)}`}
                  style={{
                    height: `${Math.min(80 + property.priceToRentRatio * 8, 140)}px`,
                    marginTop: `${Math.random() * 30}px`,
                  }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-lg font-bold">{property.priceToRentRatio.toFixed(1)}%</div>
                    <div className="text-xs opacity-90">{property.zipCode}</div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <TrendingUp className="w-4 h-4 text-white opacity-80" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Modern Markers View
            <div className="relative h-full">
              {filteredProperties.slice(0, 20).map((property, index) => (
                <div
                  key={property.id}
                  className="absolute cursor-pointer transform hover:scale-110 transition-all duration-200"
                  style={{
                    top: `${20 + (index * 80) % 250}px`,
                    left: `${50 + (index * 120) % 600}px`
                  }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className={`w-10 h-10 rounded-full ${getRatioColor(property.priceToRentRatio)} flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white`}>
                    {property.priceToRentRatio.toFixed(1)}
                  </div>
                  <div className="mt-2 text-xs text-center text-gray-700 max-w-20 truncate bg-white px-2 py-1 rounded shadow-sm">
                    {property.city}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modern Legend */}
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-sm font-semibold mb-3 text-gray-900">Price-to-Rent Ratio</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Below Market (&lt;4.5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Good Deal (4.5-6%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Exceptional (6%+)</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="absolute top-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="text-sm font-semibold mb-2 text-gray-900">Quick Stats</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Total Properties: {filteredProperties.length}</div>
            <div>Avg Ratio: {(filteredProperties.reduce((sum, p) => sum + p.priceToRentRatio, 0) / filteredProperties.length || 0).toFixed(1)}%</div>
            <div>Exceptional Deals: {filteredProperties.filter(p => p.priceToRentRatio >= 6.0).length}</div>
          </div>
        </div>
      </div>

      {/* Modern Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedProperty.address}</h3>
                  <p className="text-sm text-gray-500">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getRatioColorClass(selectedProperty.priceToRentRatio)}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {selectedProperty.priceToRentRatio.toFixed(1)}% Ratio
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">List Price</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${selectedProperty.listPrice?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Est. Rent</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${selectedProperty.estimatedRent?.toLocaleString()}/mo
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Property Type</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProperty.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bedrooms</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProperty.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bathrooms</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProperty.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Square Feet</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProperty.squareFeet?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cap Rate</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProperty.capRate?.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  View Full Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernPropertyMap;
