import React, { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import ROIHeatmap from './ROIHeatmap';
import ROITable from './ROITable';
import SavedSearches from './SavedSearches';
import { apiService } from '../../services/api';

const Dashboard = ({ user }) => {
  const [activeView, setActiveView] = useState('map'); // 'map' or 'table'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    county: '',
    zipCode: '',
    minPrice: '',
    maxPrice: '',
    minRent: '',
    propertyType: '3bed2bath'
  });
  const [savedSearches, setSavedSearches] = useState([]);

  // Load saved searches on component mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const searches = await apiService.getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    if (newFilters.state) {
      await fetchData(newFilters);
    }
  };

  const fetchData = async (searchFilters = filters) => {
    setLoading(true);
    try {
      const response = await apiService.getPricingData(searchFilters);
      setData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentSearch = async (searchName) => {
    try {
      await apiService.saveSearch({
        searchName,
        filters
      });
      await loadSavedSearches();
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const loadSavedSearch = (savedFilters) => {
    setFilters(savedFilters);
    fetchData(savedFilters);
  };

  const deleteSavedSearch = async (searchId) => {
    try {
      await apiService.deleteSavedSearch(searchId);
      await loadSavedSearches();
    } catch (error) {
      console.error('Failed to delete search:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Investment Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {user.email}. Find your next profitable investment.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters & Saved Searches */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
              onSaveSearch={saveCurrentSearch}
            />
            <SavedSearches
              searches={savedSearches}
              onLoadSearch={loadSavedSearch}
              onDeleteSearch={deleteSavedSearch}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* View Toggle */}
            <div className="mb-6">
              <div className="flex bg-gray-800 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setActiveView('map')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeView === 'map'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🗺️ Map View
                </button>
                <button
                  onClick={() => setActiveView('table')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeView === 'table'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📊 Table View
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="animate-pulse text-gray-400">
                  Loading ROI data...
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loading && data.length === 0 && filters.state && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  No data found for the selected filters.
                </div>
                <p className="text-sm text-gray-500">
                  Try adjusting your search criteria or selecting a different area.
                </p>
              </div>
            )}

            {/* Initial State */}
            {!filters.state && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  Select a state to begin exploring investment opportunities.
                </div>
                <p className="text-sm text-gray-500">
                  Use the filters on the left to start your search.
                </p>
              </div>
            )}

            {/* Data Views */}
            {!loading && data.length > 0 && (
              <>
                {activeView === 'map' && (
                  <ROIHeatmap data={data} />
                )}
                {activeView === 'table' && (
                  <ROITable data={data} />
                )}
              </>
            )}

            {/* Quick Stats */}
            {data.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {data.length}
                  </div>
                  <div className="text-sm text-gray-400">Areas Found</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.max(...data.map(d => d.gross_rental_yield || 0)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Top Yield</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${Math.min(...data.map(d => d.median_price || Infinity)).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Lowest Price</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${Math.max(...data.map(d => d.median_rent || 0)).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Top Rent</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
