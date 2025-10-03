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
  Settings,
  Zap,
  Star
} from 'lucide-react';

const EnhancedROIHeatMap = () => {
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
  const [mapStyle, setMapStyle] = useState('roi-focused');

  // Enhanced ROI calculation for sizing
  const calculateROIScore = (property) => {
    const baseScore = property.priceToRentRatio || 0;
    const capRate = property.capRate || 0;
    const priceScore = property.listPrice < 200000 ? 1.2 : property.listPrice < 400000 ? 1.0 : 0.8;
    
    // Composite ROI score (0-100)
    return Math.min(100, Math.max(10, 
      (baseScore * 8) + 
      (capRate * 3) + 
      (priceScore * 10)
    ));
  };

  // Dynamic sizing based on ROI score
  const getPropertySize = (property) => {
    const roiScore = calculateROIScore(property);
    const baseSize = 40;
    const maxSize = 120;
    const minSize = 25;
    
    // Scale size based on ROI score (10-100 range)
    const scaleFactor = (roiScore - 10) / 90; // Normalize to 0-1
    const size = minSize + (scaleFactor * (maxSize - minSize));
    
    return {
      width: Math.round(size),
      height: Math.round(size * 0.8), // Slightly rectangular
      fontSize: Math.round(8 + scaleFactor * 6) // 8px to 14px
    };
  };

  // Enhanced color coding for ROI levels
  const getROIColor = (property) => {
    const roiScore = calculateROIScore(property);
    
    if (roiScore >= 80) return 'from-emerald-500 to-green-600'; // Exceptional
    if (roiScore >= 60) return 'from-blue-500 to-indigo-600';   // Excellent  
    if (roiScore >= 40) return 'from-yellow-500 to-orange-500'; // Good
    if (roiScore >= 25) return 'from-orange-500 to-red-500';    // Fair
    return 'from-gray-400 to-gray-500'; // Poor
  };

  // Get ROI tier label
  const getROITier = (property) => {
    const roiScore = calculateROIScore(property);
    
    if (roiScore >= 80) return { label: 'EXCEPTIONAL', icon: '🔥' };
    if (roiScore >= 60) return { label: 'EXCELLENT', icon: '⭐' };
    if (roiScore >= 40) return { label: 'GOOD', icon: '👍' };
    if (roiScore >= 25) return { label: 'FAIR', icon: '📈' };
    return { label: 'POOR', icon: '📉' };
  };

  // Fetch properties from API
  const fetchProperties = async (searchFilters = {}) => {
    setLoading(true);
    try {
      // Use the same API base URL logic as auth service
      let baseUrl = process.env.REACT_APP_API_URL || 'https://roiscout-production.up.railway.app';
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }
      const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key]) {
          params.append(key, searchFilters[key]);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/properties?${params}&limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const propertiesData = data.properties || [];
      
      // Transform and enhance property data
      const enhancedProperties = propertiesData.map(prop => ({
        id: prop.id,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zipCode: prop.zip_code,
        latitude: prop.latitude,
        longitude: prop.longitude,
        listPrice: prop.list_price,
        estimatedRent: prop.estimated_rent,
        priceToRentRatio: prop.price_to_rent_ratio,
        capRate: prop.cap_rate,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        squareFeet: prop.square_feet,
        propertyType: prop.property_type,
        dataSource: prop.data_source,
        lastUpdated: prop.last_updated,
        isExceptionalDeal: prop.is_exceptional_deal,
        roiScore: 0 // Will be calculated
      }));

      // Calculate ROI scores for all properties
      enhancedProperties.forEach(prop => {
        prop.roiScore = calculateROIScore(prop);
      });

      // Sort by ROI score (highest first)
      enhancedProperties.sort((a, b) => b.roiScore - a.roiScore);
      
      setProperties(enhancedProperties);
      setFilteredProperties(enhancedProperties);
      
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Use sample data for development
      const sampleProperties = generateSampleProperties();
      setProperties(sampleProperties);
      setFilteredProperties(sampleProperties);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample properties for development
  const generateSampleProperties = () => {
    const sampleData = [];
    const cities = ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth'];
    const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'];
    
    for (let i = 0; i < 50; i++) {
      const listPrice = 150000 + Math.random() * 400000;
      const estimatedRent = listPrice * (0.008 + Math.random() * 0.004); // 0.8% to 1.2% monthly
      const priceToRentRatio = (estimatedRent * 12 / listPrice) * 100;
      const capRate = priceToRentRatio * (0.7 + Math.random() * 0.3); // Rough cap rate estimate
      
      const property = {
        id: i + 1,
        address: `${1000 + i} Sample St`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: 'TX',
        zipCode: `7${String(Math.floor(Math.random() * 9000) + 1000)}`,
        latitude: 30.2672 + (Math.random() - 0.5) * 2,
        longitude: -97.7431 + (Math.random() - 0.5) * 2,
        listPrice: Math.round(listPrice),
        estimatedRent: Math.round(estimatedRent),
        priceToRentRatio: Math.round(priceToRentRatio * 100) / 100,
        capRate: Math.round(capRate * 100) / 100,
        bedrooms: Math.floor(Math.random() * 4) + 2,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        squareFeet: Math.floor(1200 + Math.random() * 2000),
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        dataSource: 'Sample Data',
        lastUpdated: new Date().toISOString(),
        isExceptionalDeal: priceToRentRatio > 6,
        roiScore: 0
      };
      
      property.roiScore = calculateROIScore(property);
      sampleData.push(property);
    }
    
    return sampleData.sort((a, b) => b.roiScore - a.roiScore);
  };

  // Apply filters
  useEffect(() => {
    let filtered = properties;
    
    if (filters.zipCode) {
      filtered = filtered.filter(p => p.zipCode.includes(filters.zipCode));
    }
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.listPrice >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.listPrice <= parseInt(filters.maxPrice));
    }
    if (filters.minRatio) {
      filtered = filtered.filter(p => p.priceToRentRatio >= parseFloat(filters.minRatio));
    }
    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);
    }
    if (filters.bedroomsMin) {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.bedroomsMin));
    }
    
    setFilteredProperties(filtered);
  }, [filters, properties]);

  // Load data on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ROI opportunities...</p>
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
              <Target className="w-6 h-6" />
              ROI Heat Map
            </h2>
            <p className="text-blue-100 mt-1">
              {filteredProperties.length} properties • Sized by ROI potential
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
            <div className="flex bg-white bg-opacity-20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'heatmap' 
                    ? 'bg-white text-blue-600 font-medium' 
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Heat Map
              </button>
              <button
                onClick={() => setViewMode('markers')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  viewMode === 'markers' 
                    ? 'bg-white text-blue-600 font-medium' 
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-1" />
                Markers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Zip Code"
              value={filters.zipCode}
              onChange={(e) => handleFilterChange('zipCode', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Min ROI %"
              value={filters.minRatio}
              onChange={(e) => handleFilterChange('minRatio', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Single Family">Single Family</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Multi-Family">Multi-Family</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Map Container */}
      <div className="relative h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 opacity-60"></div>
        
        {/* Grid overlay for better visual structure */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* Property Visualization */}
        <div className="relative h-full p-6">
          {viewMode === 'heatmap' ? (
            // Enhanced ROI-Based Heatmap
            <div className="grid grid-cols-6 gap-3 h-full">
              {filteredProperties.slice(0, 30).map((property, index) => {
                const size = getPropertySize(property);
                const tier = getROITier(property);
                
                return (
                  <div
                    key={property.id}
                    className={`relative rounded-xl cursor-pointer transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl bg-gradient-to-br ${getROIColor(property)} animate-pulse-slow`}
                    style={{
                      width: `${size.width}px`,
                      height: `${size.height}px`,
                      marginTop: `${Math.random() * 40}px`,
                      marginLeft: `${Math.random() * 20}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                    onClick={() => setSelectedProperty(property)}
                  >
                    {/* Glow effect for exceptional deals */}
                    {property.roiScore >= 80 && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 animate-pulse"></div>
                    )}
                    
                    <div className="relative h-full bg-white bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-30">
                      {/* ROI Score */}
                      <div className="absolute top-2 left-2 text-white">
                        <div className="text-lg font-bold" style={{ fontSize: `${size.fontSize}px` }}>
                          {property.roiScore.toFixed(0)}
                        </div>
                        <div className="text-xs opacity-90">ROI</div>
                      </div>
                      
                      {/* Tier indicator */}
                      <div className="absolute top-2 right-2 text-white">
                        <span className="text-sm">{tier.icon}</span>
                      </div>
                      
                      {/* Property details */}
                      <div className="absolute bottom-2 left-2 text-white">
                        <div className="text-xs opacity-90">{property.zipCode}</div>
                        <div className="text-xs font-medium">${(property.listPrice / 1000).toFixed(0)}k</div>
                      </div>
                      
                      {/* Price-to-rent ratio */}
                      <div className="absolute bottom-2 right-2 text-white">
                        <div className="text-xs font-bold">{property.priceToRentRatio.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Enhanced Markers View
            <div className="relative h-full">
              {filteredProperties.slice(0, 50).map((property, index) => {
                const size = getPropertySize(property);
                const tier = getROITier(property);
                
                return (
                  <div
                    key={property.id}
                    className="absolute cursor-pointer transform hover:scale-125 transition-all duration-300"
                    style={{
                      top: `${20 + (index * 60) % 400}px`,
                      left: `${50 + (index * 80) % 700}px`
                    }}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div 
                      className={`rounded-full bg-gradient-to-br ${getROIColor(property)} flex items-center justify-center text-white font-bold shadow-lg border-2 border-white`}
                      style={{
                        width: `${size.width * 0.6}px`,
                        height: `${size.width * 0.6}px`,
                        fontSize: `${size.fontSize - 2}px`
                      }}
                    >
                      {property.roiScore.toFixed(0)}
                    </div>
                    <div className="mt-1 text-xs text-center text-gray-700 max-w-16 truncate">
                      {property.zipCode}
                    </div>
                    <div className="text-xs text-center text-gray-600">
                      {tier.icon}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enhanced Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-lg border">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ROI Score Legend
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded"></div>
              <span className="text-xs">Exceptional (80+) 🔥</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
              <span className="text-xs">Excellent (60-79) ⭐</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded"></div>
              <span className="text-xs">Good (40-59) 👍</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
              <span className="text-xs">Fair (25-39) 📈</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t text-xs text-gray-600">
            Size = ROI Potential
          </div>
        </div>

        {/* Stats Panel */}
        <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border">
          <div className="text-sm font-semibold mb-2">Market Stats</div>
          <div className="space-y-1 text-xs">
            <div>Total Properties: {filteredProperties.length}</div>
            <div>Exceptional Deals: {filteredProperties.filter(p => p.roiScore >= 80).length}</div>
            <div>Avg ROI Score: {(filteredProperties.reduce((sum, p) => sum + p.roiScore, 0) / filteredProperties.length || 0).toFixed(1)}</div>
            <div>Best ROI: {Math.max(...filteredProperties.map(p => p.roiScore)).toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Property Details</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* ROI Score Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getROIColor(selectedProperty)} text-white font-bold`}>
                  <Star className="w-4 h-4" />
                  ROI Score: {selectedProperty.roiScore.toFixed(0)}
                  <span className="ml-2">{getROITier(selectedProperty).icon}</span>
                </div>
                
                {/* Property Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Address</div>
                    <div className="font-medium">{selectedProperty.address}</div>
                    <div className="text-sm text-gray-600">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Property Type</div>
                    <div className="font-medium">{selectedProperty.propertyType}</div>
                    <div className="text-sm text-gray-600">{selectedProperty.bedrooms}bd / {selectedProperty.bathrooms}ba</div>
                  </div>
                </div>
                
                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">List Price</div>
                    <div className="text-lg font-bold text-blue-800">${selectedProperty.listPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Est. Monthly Rent</div>
                    <div className="text-lg font-bold text-green-800">${selectedProperty.estimatedRent.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-600">Price-to-Rent Ratio</div>
                    <div className="text-lg font-bold text-purple-800">{selectedProperty.priceToRentRatio.toFixed(2)}%</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-orange-600">Cap Rate</div>
                    <div className="text-lg font-bold text-orange-800">{selectedProperty.capRate.toFixed(2)}%</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                    Save to Favorites
                  </button>
                  <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedROIHeatMap;
