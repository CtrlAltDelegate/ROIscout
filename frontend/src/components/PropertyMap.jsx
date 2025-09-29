import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, DollarSign, Home, Filter } from 'lucide-react';

const PropertyMap = () => {
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
  const [viewMode, setViewMode] = useState('heatmap'); // heatmap or markers
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch properties from API
  const fetchProperties = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Build query parameters
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
      
      // Transform API data to match component expectations
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
        ratioVsMarket: ((prop.price_to_rent_ratio - 4.5) / 4.5 * 100).toFixed(1) // Calculate vs market average
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

  // Filter properties based on current filters
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
    if (ratio >= 6) return 'bg-green-500';
    if (ratio >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatioLabel = (ratio) => {
    if (ratio >= 6) return 'Excellent';
    if (ratio >= 4) return 'Good';
    return 'Fair';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg">
      {/* Header with filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <MapPin className="mr-2" size={24} />
            Property Investment Map
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'heatmap' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('markers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'markers' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Markers
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Zip Code"
            value={filters.zipCode}
            onChange={(e) => handleFilterChange('zipCode', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Min Ratio %"
            value={filters.minRatio}
            onChange={(e) => handleFilterChange('minRatio', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="single_family">Single Family</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="multi_family">Multi Family</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min Beds"
              value={filters.bedroomsMin}
              onChange={(e) => handleFilterChange('bedroomsMin', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
            />
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Clear filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative h-96 bg-gray-100">
        {/* Simulated map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>
        
        {/* Property markers/heatmap */}
        <div className="relative h-full p-4">
          {viewMode === 'heatmap' ? (
            // Heatmap view
            <div className="grid grid-cols-4 gap-4 h-full">
              {filteredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className={`relative rounded-lg opacity-80 cursor-pointer transform hover:scale-105 transition-all ${getRatioColor(property.priceToRentRatio)}`}
                  style={{
                    height: `${Math.min(80 + property.priceToRentRatio * 8, 120)}px`,
                    marginTop: `${Math.random() * 50}px`,
                    marginLeft: `${Math.random() * 20}px`
                  }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                  <div className="absolute bottom-2 left-2 text-white text-xs font-bold">
                    {property.priceToRentRatio.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Markers view
            <div className="relative h-full">
              {filteredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="absolute cursor-pointer transform hover:scale-110 transition-transform"
                  style={{
                    top: `${20 + (index * 80) % 250}px`,
                    left: `${50 + (index * 120) % 600}px`
                  }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className={`w-8 h-8 rounded-full ${getRatioColor(property.priceToRentRatio)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                    {property.priceToRentRatio.toFixed(1)}
                  </div>
                  <div className="mt-1 text-xs text-center text-gray-700 max-w-20 truncate">
                    {property.zipCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-sm font-semibold mb-2">Price-to-Rent Ratio</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs">Fair (&lt;4%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs">Good (4-6%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs">Excellent (6%+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Property details popup */}
      {selectedProperty && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Property Details</h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div className="font-medium">{selectedProperty.address}</div>
                <div className="text-sm text-gray-500">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">List Price</div>
                  <div className="font-bold text-lg">${selectedProperty.listPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Est. Rent</div>
                  <div className="font-bold text-lg">${selectedProperty.estimatedRent.toLocaleString()}/mo</div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Price-to-Rent Ratio</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getRatioColor(selectedProperty.priceToRentRatio)}`}>
                    {getRatioLabel(selectedProperty.priceToRentRatio)}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {selectedProperty.priceToRentRatio.toFixed(2)}%
                </div>
                <div className="text-sm text-green-600">
                  {selectedProperty.ratioVsMarket > 0 ? '+' : ''}{selectedProperty.ratioVsMarket.toFixed(1)}% vs market
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-sm text-gray-600">Beds</div>
                  <div className="font-bold">{selectedProperty.bedrooms}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Baths</div>
                  <div className="font-bold">{selectedProperty.bathrooms}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                  <div className="font-bold">{selectedProperty.squareFeet.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Investment Metrics</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cap Rate</span>
                    <span className="font-medium">{selectedProperty.capRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Price per Sq Ft</span>
                    <span className="font-medium">${(selectedProperty.listPrice / selectedProperty.squareFeet).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rent per Sq Ft</span>
                    <span className="font-medium">${(selectedProperty.estimatedRent / selectedProperty.squareFeet).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                  View Details
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
                  Save Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredProperties.length} of {properties.length} properties
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp size={16} className="text-green-500" />
              <span>Avg Ratio: {(filteredProperties.reduce((sum, p) => sum + p.priceToRentRatio, 0) / filteredProperties.length || 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-blue-500" />
              <span>Avg Price: ${Math.round(filteredProperties.reduce((sum, p) => sum + p.listPrice, 0) / filteredProperties.length || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;
