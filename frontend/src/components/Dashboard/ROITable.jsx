import React, { useState } from 'react';

const ROITable = ({ data }) => {
  const [sortField, setSortField] = useState('gross_rental_yield');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    
    if (sortDirection === 'asc') {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getYieldColor = (yield_val) => {
    if (yield_val >= 10) return 'text-green-400';
    if (yield_val >= 8) return 'text-green-300';
    if (yield_val >= 6) return 'text-yellow-400';
    if (yield_val >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRentRatioColor = (ratio) => {
    if (ratio >= 1.2) return 'text-green-400';
    if (ratio >= 1.0) return 'text-green-300';
    if (ratio >= 0.8) return 'text-yellow-400';
    if (ratio >= 0.6) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">ROI Analysis Results</h3>
        <p className="text-sm text-gray-400 mt-1">
          Showing {paginatedData.length} of {sortedData.length} areas
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('zip_code')}
              >
                Zip Code {getSortIcon('zip_code')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('county')}
              >
                County {getSortIcon('county')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('median_price')}
              >
                Median Price {getSortIcon('median_price')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('median_rent')}
              >
                Monthly Rent {getSortIcon('median_rent')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('rent_to_price_ratio')}
              >
                Rent/Price Ratio {getSortIcon('rent_to_price_ratio')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('gross_rental_yield')}
              >
                Rental Yield {getSortIcon('gross_rental_yield')}
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('grm')}
              >
                GRM {getSortIcon('grm')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedData.map((row, index) => (
              <tr 
                key={`${row.zip_code}-${index}`}
                className="hover:bg-gray-750 transition-colors"
              >
                <td className="px-4 py-3 text-white font-medium">
                  {row.zip_code}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {row.county}
                </td>
                <td className="px-4 py-3 text-right text-white">
                  ${(row.median_price || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-white">
                  ${(row.median_rent || 0).toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getRentRatioColor(row.rent_to_price_ratio)}`}>
                  {(row.rent_to_price_ratio || 0).toFixed(3)}
                </td>
                <td className={`px-4 py-3 text-right font-bold text-lg ${getYieldColor(row.gross_rental_yield)}`}>
                  {(row.gross_rental_yield || 0).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {(row.grm || 0).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-750 text-xs text-gray-400 border-t border-gray-700">
        <strong>Legend:</strong> 
        <span className="text-green-400 ml-2">Excellent (10%+)</span>
        <span className="text-green-300 ml-2">Good (8-10%)</span>
        <span className="text-yellow-400 ml-2">Fair (6-8%)</span>
        <span className="text-orange-400 ml-2">Poor (4-6%)</span>
        <span className="text-red-400 ml-2">Very Poor (&lt;4%)</span>
      </div>
    </div>
  );
};

export default ROITable;
