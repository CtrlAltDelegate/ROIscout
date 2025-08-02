import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const FilterPanel = ({ filters, onFilterChange, onSaveSearch }) => {
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [zipCodes, setZipCodes] = useState([]);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load counties when state changes
  useEffect(() => {
    if (filters.state) {
      loadCounties(filters.state);
    } else {
      setCounties([]);
      setZipCodes([]);
    }
  }, [filters.state]);

  // Load zip codes when county changes
  useEffect(() => {
    if (filters.county) {
      loadZipCodes(filters.county);
    } else {
      setZipCodes([]);
    }
  }, [filters.county]);

  const loadStates = async () => {
    try {
      const response = await apiService.getStates();
      setStates(response.data || []);
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  const loadCounties = async (state) => {
    try {
      const response = await apiService.getCounties(state);
      setCounties(response.data || []);
    } catch (error) {
      console.error('Failed to load counties:', error);
    }
  };

  const loadZipCodes = async (county) => {
    try {
      const response = await apiService.getZipCodes(county);
      setZipCodes(response.data || []);
    } catch (error) {
      console.error('Failed to load zip codes:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    
    // Reset dependent fields when parent changes
    if (field === 'state') {
      newFilters.county = '';
      newFilters.zipCode = '';
    } else if (field === 'county') {
      newFilters.zipCode = '';
    }
    
    onFilterChange(newFilters);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveModal(false);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      state: '',
      county: '',
      zipCode: '',
      minPrice: '',
      maxPrice: '',
      minRent: '',
      propertyType: '3bed2bath'
    };
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Search Filters</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-400 hover:text-white"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Property Type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
          >
            <option value="3bed2bath">3 Bed / 2 Bath</option>
            <option value="2bed2bath">2 Bed / 2 Bath</option>
            <option value="4bed3bath">4 Bed / 3 Bath</option>
            <option value="1bed1bath">1 Bed / 1 Bath</option>
          </select>
        </div>

        {/* State Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            State
          </label>
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>

        {/* County Selection */}
        {filters.state && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              County (Optional)
            </label>
            <select
              value={filters.county}
              onChange={(e) => handleFilterChange('county', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
            >
              <option value="">All Counties</option>
              {counties.map(county => (
                <option key={county.name} value={county.name}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Zip Code Selection */}
        {filters.county && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Zip Code (Optional)
            </label>
            <select
              value={filters.zipCode}
              onChange={(e) => handleFilterChange('zipCode', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
            >
              <option value="">All Zip Codes</option>
              {zipCodes.map(zip => (
                <option key={zip.code} value={zip.code}>
                  {zip.code}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Price
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="$0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Price
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="No limit"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
            />
          </div>
        </div>

        {/* Minimum Rent */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Monthly Rent
          </label>
          <input
            type="number"
            value={filters.minRent}
            onChange={(e) => handleFilterChange('minRent', e.target.value)}
            placeholder="$0"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white"
          />
        </div>

        {/* Save Search Button */}
        {filters.state && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            💾 Save This Search
          </button>
        )}
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold text-white mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 text-white mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSearch}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
