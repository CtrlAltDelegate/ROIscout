import React, { useState } from 'react';

const SavedSearches = ({ searches, onLoadSearch, onDeleteSearch }) => {
  const [expandedSearch, setExpandedSearch] = useState(null);

  const formatFilters = (filters) => {
    const parts = [];
    if (filters.state)    parts.push(`State: ${filters.state}`);
    if (filters.county)   parts.push(`County: ${filters.county}`);
    if (filters.zipCode)  parts.push(`Zip: ${filters.zipCode}`);
    if (filters.minPrice) parts.push(`Min: $${parseInt(filters.minPrice).toLocaleString()}`);
    if (filters.maxPrice) parts.push(`Max: $${parseInt(filters.maxPrice).toLocaleString()}`);
    if (filters.minRent)  parts.push(`Min Rent: $${parseInt(filters.minRent).toLocaleString()}`);
    return parts.join(' · ') || 'No filters applied';
  };

  const handleDeleteSearch = (searchId, searchName) => {
    if (window.confirm(`Delete saved search "${searchName}"?`)) {
      onDeleteSearch(searchId);
    }
  };

  if (searches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">💾</div>
        <p className="text-slate-700 font-medium mb-1">No saved searches yet</p>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
          Go to <strong>Search &amp; List</strong>, set your filters, then click <strong>💾 Save Search</strong> to save them here for quick access later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">
          Saved Searches <span className="text-slate-400 font-normal text-sm">({searches.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Click Load to jump straight to that filter set.</p>
      </div>

      <div className="divide-y divide-slate-100">
        {searches.map((search) => {
          const isExpanded = expandedSearch === search.id;
          return (
            <div key={search.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{search.search_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{formatFilters(search.filters)}</p>
                  {search.created_at && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Saved {new Date(search.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedSearch(isExpanded ? null : search.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                  >
                    {isExpanded ? 'Less ▲' : 'More ▼'}
                  </button>
                  <button
                    onClick={() => onLoadSearch(search.filters)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(search.id, search.search_name)}
                    className="text-slate-400 hover:text-red-500 transition-colors px-1.5 py-1.5 rounded"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {search.filters.propertyType && (
                    <div><span className="text-slate-400">Property:</span> <span className="text-slate-700">{search.filters.propertyType}</span></div>
                  )}
                  {search.filters.state && (
                    <div><span className="text-slate-400">State:</span> <span className="text-slate-700">{search.filters.state}</span></div>
                  )}
                  {search.filters.county && (
                    <div><span className="text-slate-400">County:</span> <span className="text-slate-700">{search.filters.county}</span></div>
                  )}
                  {search.filters.zipCode && (
                    <div><span className="text-slate-400">Zip:</span> <span className="text-slate-700">{search.filters.zipCode}</span></div>
                  )}
                  {(search.filters.minPrice || search.filters.maxPrice) && (
                    <div>
                      <span className="text-slate-400">Price:</span>{' '}
                      <span className="text-slate-700">
                        {search.filters.minPrice ? `$${parseInt(search.filters.minPrice).toLocaleString()}` : 'Any'}
                        {' – '}
                        {search.filters.maxPrice ? `$${parseInt(search.filters.maxPrice).toLocaleString()}` : 'Any'}
                      </span>
                    </div>
                  )}
                  {search.filters.minRent && (
                    <div><span className="text-slate-400">Min Rent:</span> <span className="text-slate-700">${parseInt(search.filters.minRent).toLocaleString()}</span></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedSearches;
