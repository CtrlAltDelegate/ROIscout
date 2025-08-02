import React, { useState } from 'react';

const SavedSearches = ({ searches, onLoadSearch, onDeleteSearch }) => {
  const [expandedSearch, setExpandedSearch] = useState(null);

  const formatFilters = (filters) => {
    const parts = [];
    
    if (filters.state) parts.push(`State: ${filters.state}`);
    if (filters.county) parts.push(`County: ${filters.county}`);
    if (filters.zipCode) parts.push(`Zip: ${filters.zipCode}`);
    if (filters.minPrice) parts.push(`Min: $${parseInt(filters.minPrice).toLocaleString()}`);
    if (filters.maxPrice) parts.push(`Max: $${parseInt(filters.maxPrice).toLocaleString()}`);
    if (filters.minRent) parts.push(`Min Rent: $${parseInt(filters.minRent).toLocaleString()}`);
    
    return parts.join(', ') || 'No filters';
  };

  const handleLoadSearch = (search) => {
    onLoadSearch(search.filters);
  };

  const handleDeleteSearch = (searchId, searchName) => {
    if (window.confirm(`Delete saved search "${searchName}"?`)) {
      onDeleteSearch(searchId);
    }
  };

  const toggleExpanded = (searchId) => {
    setExpandedSearch(expandedSearch === searchId ? null : searchId);
  };

  if (searches.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Saved Searches</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">💾</div>
          <p className="text-gray-400 text-sm">
            No saved searches yet. Save your current search to quickly return to it later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Saved Searches ({searches.length})
      </h3>
      
      <div className="space-y-3">
        {searches.map((search) => (
          <div
            key={search.id}
            className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium truncate pr-2">
                  {search.search_name}
                </h4>
                <button
                  onClick={() => toggleExpanded(search.id)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  {expandedSearch === search.id ? '▼' : '▶'}
                </button>
              </div>
              
              <div className="text-xs text-gray-400 mb-3">
                {formatFilters(search.filters)}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteSearch(search.id, search.search_name)}
                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedSearch === search.id && (
              <div className="border-t border-gray-600 p-3 bg-gray-750">
                <div className="text-xs text-gray-400 mb-2">Search Details:</div>
                <div className="space-y-1 text-xs">
                  {search.filters.propertyType && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">Property:</span> {search.filters.propertyType}
                    </div>
                  )}
                  {search.filters.state && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">State:</span> {search.filters.state}
                    </div>
                  )}
                  {search.filters.county && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">County:</span> {search.filters.county}
                    </div>
                  )}
                  {search.filters.zipCode && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">Zip Code:</span> {search.filters.zipCode}
                    </div>
                  )}
                  {(search.filters.minPrice || search.filters.maxPrice) && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">Price Range:</span> 
                      {search.filters.minPrice ? ` $${parseInt(search.filters.minPrice).toLocaleString()}` : ' Any'}
                      {' - '}
                      {search.filters.maxPrice ? `$${parseInt(search.filters.maxPrice).toLocaleString()}` : 'Any'}
                    </div>
                  )}
                  {search.filters.minRent && (
                    <div className="text-gray-300">
                      <span className="text-gray-400">Min Rent:</span> ${parseInt(search.filters.minRent).toLocaleString()}
                    </div>
                  )}
                </div>
                
                {search.created_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Saved: {new Date(search.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 p-3 bg-gray-750 rounded border border-gray-600">
        <div className="text-xs text-gray-400 mb-2">Quick Tips:</div>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Save frequently used search criteria</li>
          <li>• Load saved searches to quickly compare markets</li>
          <li>• Delete outdated searches to keep organized</li>
        </ul>
      </div>
    </div>
  );
};

export default SavedSearches;
