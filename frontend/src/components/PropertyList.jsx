import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, TrendingUp, MapPin, ArrowUpDown, ArrowUp, ArrowDown, Eye, Heart, FileText, Share2, Copy } from 'lucide-react';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'priceToRentRatio', direction: 'desc' });
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRatio: '',
    maxRatio: '',
    bedrooms: '',
    propertyType: '',
    zipCode: ''
  });
  const [favorites, setFavorites] = useState(new Set());

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('roiscout-favorites');
    if (savedFavorites) {
      try {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);
  const [showFilters, setShowFilters] = useState(false);
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
        listPrice: prop.list_price,
        estimatedRent: prop.estimated_rent,
        priceToRentRatio: prop.price_to_rent_ratio,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        squareFeet: prop.square_feet,
        propertyType: prop.property_type,
        capRate: prop.cap_rate,
        dataSource: prop.data_source,
        lastUpdated: prop.last_updated,
        anomalyFlag: prop.price_to_rent_ratio > 6.0 // Flag properties with good ratios
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
    fetchProperties();
  }, []);

  // Apply search and filters
  useEffect(() => {
    let filtered = properties.filter(property => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          property.address.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower) ||
          property.zipCode.includes(searchTerm) ||
          property.propertyType.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Price filters
      if (filters.minPrice && property.listPrice < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && property.listPrice > parseInt(filters.maxPrice)) return false;
      
      // Ratio filters
      if (filters.minRatio && property.priceToRentRatio < parseFloat(filters.minRatio)) return false;
      if (filters.maxRatio && property.priceToRentRatio > parseFloat(filters.maxRatio)) return false;
      
      // Other filters
      if (filters.bedrooms && property.bedrooms !== parseInt(filters.bedrooms)) return false;
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      if (filters.zipCode && !property.zipCode.includes(filters.zipCode)) return false;

      return true;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    setFilteredProperties(filtered);
  }, [searchTerm, filters, sortConfig, properties]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={16} className="text-gray-400" />;
    }
    return sortConfig.direction === 'desc' 
      ? <ArrowDown size={16} className="text-blue-500" />
      : <ArrowUp size={16} className="text-blue-500" />;
  };

  const toggleFavorite = (propertyId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      
      // Save to localStorage
      localStorage.setItem('roiscout-favorites', JSON.stringify([...newFavorites]));
      
      return newFavorites;
    });
  };

  const clearAllFavorites = () => {
    setFavorites(new Set());
    localStorage.removeItem('roiscout-favorites');
  };

  const exportFavorites = () => {
    const favoriteProperties = filteredProperties.filter(prop => favorites.has(prop.id));
    
    if (favoriteProperties.length === 0) {
      alert('No favorite properties to export.');
      return;
    }

    const headers = ['Address', 'City', 'State', 'Zip', 'List Price', 'Est Rent', 'Ratio %', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Type'];
    const csvContent = [
      headers.join(','),
      ...favoriteProperties.map(prop => [
        `"${prop.address}"`,
        prop.city,
        prop.state,
        prop.zipCode,
        prop.listPrice,
        prop.estimatedRent,
        prop.priceToRentRatio,
        prop.bedrooms,
        prop.bathrooms,
        prop.squareFeet,
        `"${prop.propertyType}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roiscout-favorites-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    // Add current filters to share link
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    const shareUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share link copied to clipboard!');
    });
  };

  // Load filters from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = {};
    const urlSearch = urlParams.get('search');
    
    // Load filters from URL
    Object.keys(filters).forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        urlFilters[key] = value;
      }
    });
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
    
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, []);

  const exportToCSV = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/export/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roiscout-properties-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const exportToPDF = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roiscout-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const getRatioColorClass = (ratio) => {
    if (ratio >= 6) return 'text-green-600 bg-green-50';
    if (ratio >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header with search and controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Property Search Results</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <FileText size={16} />
              Export PDF
            </button>
            {favorites.size > 0 && (
              <>
                <button
                  onClick={exportFavorites}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
                >
                  <Heart size={16} />
                  Export Favorites ({favorites.size})
                </button>
                <button
                  onClick={clearAllFavorites}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Clear Favorites
                </button>
              </>
            )}
            <button
              onClick={generateShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              title="Share current search and filters"
            >
              <Share2 size={16} />
              Share Search
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by address, city, zip code, or property type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Min Ratio %"
              value={filters.minRatio}
              onChange={(e) => setFilters(prev => ({ ...prev, minRatio: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Ratio %"
              value={filters.maxRatio}
              onChange={(e) => setFilters(prev => ({ ...prev, maxRatio: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Beds</option>
              <option value="1">1+ Bed</option>
              <option value="2">2+ Beds</option>
              <option value="3">3+ Beds</option>
              <option value="4">4+ Beds</option>
            </select>
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Single Family">Single Family</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Multi Family">Multi Family</option>
            </select>
            <input
              type="text"
              placeholder="Zip Code"
              value={filters.zipCode}
              onChange={(e) => setFilters(prev => ({ ...prev, zipCode: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Results summary */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold">{filteredProperties.length}</span> of <span className="font-semibold">{properties.length}</span> properties
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp size={16} className="text-green-500" />
              <span>Avg Ratio: {(filteredProperties.reduce((sum, p) => sum + p.priceToRentRatio, 0) / filteredProperties.length || 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500" />
              <span>{filteredProperties.filter(p => p.anomalyFlag).length} exceptional deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Property table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('address')}>
                  Property
                  {getSortIcon('address')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('listPrice')}>
                  List Price
                  {getSortIcon('listPrice')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('estimatedRent')}>
                  Est. Rent
                  {getSortIcon('estimatedRent')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('priceToRentRatio')}>
                  Ratio %
                  {getSortIcon('priceToRentRatio')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSort('ratioVsMarket')}>
                  vs Market
                  {getSortIcon('ratioVsMarket')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProperties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          {property.address}
                        </div>
                        {property.anomalyFlag && (
                          <Star size={16} className="text-yellow-500 fill-current" title="Exceptional deal" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {property.city}, {property.state} {property.zipCode}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${property.listPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${Math.round(property.listPrice / property.squareFeet)}/sqft
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${property.estimatedRent.toLocaleString()}/mo
                  </div>
                  <div className="text-sm text-gray-500">
                    ${(property.estimatedRent / property.squareFeet).toFixed(2)}/sqft
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatioColorClass(property.priceToRentRatio)}`}>
                    {property.priceToRentRatio.toFixed(2)}%
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Cap: {property.capRate.toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{property.bedrooms} bed, {property.bathrooms} bath</div>
                  <div>{property.squareFeet.toLocaleString()} sqft</div>
                  <div className="text-xs text-gray-400">{property.propertyType}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${property.ratioVsMarket > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {property.ratioVsMarket > 0 ? '+' : ''}{property.ratioVsMarket.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">vs neighborhood</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className={`p-1 rounded-full transition-colors ${
                        favorites.has(property.id) 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                      title={favorites.has(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={16} className={favorites.has(property.id) ? 'fill-current' : ''} />
                    </button>
                    <button
                      className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No properties found</div>
            <div className="text-gray-400 text-sm">Try adjusting your search criteria or filters</div>
          </div>
        )}
      </div>

      {/* Pagination (placeholder) */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing 1 to {filteredProperties.length} of {filteredProperties.length} results
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled 
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-500 text-white rounded text-sm">1</span>
            <button 
              disabled 
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyList;
