import React, { useState, useMemo } from 'react';
import DataFreshnessBadge from '../Shared/DataFreshnessBadge';
import { calcCashFlow } from '../../utils/cashFlow';

/** Colour cash flow values green / red */
const cfColor = (val) => (val >= 0 ? 'text-emerald-400' : 'text-red-400');

/** Colour cash-on-cash % */
const cocColor = (pct) => {
  if (pct >= 10) return 'text-emerald-400';
  if (pct >= 6)  return 'text-emerald-300';
  if (pct >= 2)  return 'text-yellow-400';
  if (pct >= 0)  return 'text-orange-400';
  return 'text-red-400';
};

const getYieldColor = (y) => {
  const n = Number(y);
  if (n >= 10) return 'text-green-400';
  if (n >= 8)  return 'text-green-300';
  if (n >= 6)  return 'text-yellow-400';
  if (n >= 4)  return 'text-orange-400';
  return 'text-red-400';
};

const getRentRatioColor = (r) => {
  const n = Number(r);
  if (n >= 1.2) return 'text-green-400';
  if (n >= 1.0) return 'text-green-300';
  if (n >= 0.8) return 'text-yellow-400';
  if (n >= 0.6) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * ROITable
 *
 * Props:
 *   data            — raw rows from the API
 *   dataLastUpdated — ISO string for freshness badge
 *   dataSources     — object for freshness badge
 *   cashFlowParams  — investor params from CashFlowPanel (null = standard view)
 */
const ROITable = ({ data, dataLastUpdated, dataSources, cashFlowParams }) => {
  const cfMode = !!cashFlowParams;

  const [sortField, setSortField]       = useState(cfMode ? 'cashOnCash' : 'gross_rental_yield');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage]                  = useState(20);
  const [expandedRow, setExpandedRow]   = useState(null);

  // When cash-flow mode toggles, reset sort to the appropriate default
  const effectiveSortField = cfMode && sortField === 'gross_rental_yield'
    ? 'cashOnCash'
    : !cfMode && sortField === 'cashOnCash'
    ? 'gross_rental_yield'
    : sortField;

  // Enrich each row with cash-flow data when in CF mode
  const enriched = useMemo(() => {
    if (!cfMode) return data.map(r => ({ ...r, _cf: null }));

    const maxPrice = cashFlowParams.downPct > 0
      ? (Number(cashFlowParams.downBudget) || 0) / (cashFlowParams.downPct / 100)
      : Infinity;

    return data
      .map(r => {
        const cf = calcCashFlow(r, cashFlowParams);
        return { ...r, _cf: cf };
      })
      .filter(r => r._cf !== null && Number(r.median_price) <= maxPrice);
  }, [data, cashFlowParams, cfMode]);

  // Sort
  const sortedData = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let aVal, bVal;
      if (effectiveSortField === 'cashOnCash') {
        aVal = a._cf?.cashOnCash ?? -Infinity;
        bVal = b._cf?.cashOnCash ?? -Infinity;
      } else if (effectiveSortField === 'monthlyCashFlow') {
        aVal = a._cf?.monthlyCashFlow ?? -Infinity;
        bVal = b._cf?.monthlyCashFlow ?? -Infinity;
      } else {
        aVal = a[effectiveSortField] || 0;
        bVal = b[effectiveSortField] || 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [enriched, effectiveSortField, sortDirection]);

  // Paginate
  const totalPages   = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex   = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (effectiveSortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (effectiveSortField !== field) return <span className="text-gray-600 ml-0.5">↕</span>;
    return <span className="text-emerald-400 ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const thCls = "px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white select-none";

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {cfMode ? '💰 Cash Flow Analysis' : 'ROI Analysis Results'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {cfMode
                ? `${sortedData.length} affordable markets · sorted by cash-on-cash return`
                : `Showing ${paginatedData.length} of ${sortedData.length} areas`}
            </p>
          </div>
          <DataFreshnessBadge
            dataLastUpdated={dataLastUpdated}
            dataSources={dataSources}
            className="[&_span]:bg-gray-700 [&_span]:text-gray-300 [&_span]:border-gray-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/40">
            <tr>
              <th className={`${thCls} text-left`} onClick={() => handleSort('zip_code')}>
                Zip {getSortIcon('zip_code')}
              </th>
              <th className={`${thCls} text-left`} onClick={() => handleSort('county')}>
                County {getSortIcon('county')}
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort('median_price')}>
                Med. Price {getSortIcon('median_price')}
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort('median_rent')}>
                Mo. Rent {getSortIcon('median_rent')}
              </th>

              {cfMode ? (
                <>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('monthlyCashFlow')}>
                    Mo. Cash Flow {getSortIcon('monthlyCashFlow')}
                  </th>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('cashOnCash')}>
                    CoC Return {getSortIcon('cashOnCash')}
                  </th>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('gross_rental_yield')}>
                    Gross Yield {getSortIcon('gross_rental_yield')}
                  </th>
                </>
              ) : (
                <>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('rent_to_price_ratio')}>
                    Rent/Price {getSortIcon('rent_to_price_ratio')}
                  </th>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('gross_rental_yield')}>
                    Yield {getSortIcon('gross_rental_yield')}
                  </th>
                  <th className={`${thCls} text-right`} onClick={() => handleSort('grm')}>
                    GRM {getSortIcon('grm')}
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700/60">
            {paginatedData.map((row, index) => {
              const cf = row._cf;
              const isExpanded = expandedRow === `${row.zip_code}-${index}`;

              return (
                <React.Fragment key={`${row.zip_code}-${index}`}>
                  <tr
                    className={`hover:bg-gray-700/40 transition-colors ${cfMode ? 'cursor-pointer' : ''}`}
                    onClick={() => cfMode && setExpandedRow(isExpanded ? null : `${row.zip_code}-${index}`)}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {row.zip_code}
                      {cfMode && (
                        <span className="ml-1.5 text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{row.county}</td>
                    <td className="px-4 py-3 text-right text-white">
                      ${(Number(row.median_price) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      ${(cfMode && cf ? cf.rent : Number(row.median_rent) || 0).toLocaleString()}
                      {cfMode && cf && cf.rentMultiplier !== 1.0 && (
                        <span className="text-gray-500 text-xs ml-1">({cf.beds}BR)</span>
                      )}
                    </td>

                    {cfMode ? (
                      <>
                        <td className={`px-4 py-3 text-right font-semibold ${cfColor(cf?.monthlyCashFlow ?? 0)}`}>
                          {cf ? `${cf.monthlyCashFlow >= 0 ? '+' : ''}$${Math.round(cf.monthlyCashFlow).toLocaleString()}` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-base ${cocColor(cf?.cashOnCash ?? 0)}`}>
                          {cf ? `${cf.cashOnCash.toFixed(1)}%` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${getYieldColor(Number(row.gross_rental_yield))}`}>
                          {(Number(row.gross_rental_yield) || 0).toFixed(1)}%
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`px-4 py-3 text-right font-medium ${getRentRatioColor(Number(row.rent_to_price_ratio))}`}>
                          {(Number(row.rent_to_price_ratio) || 0).toFixed(3)}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-lg ${getYieldColor(Number(row.gross_rental_yield))}`}>
                          {(Number(row.gross_rental_yield) || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          {(Number(row.grm) || 0).toFixed(1)}
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expanded cash-flow breakdown row */}
                  {cfMode && isExpanded && cf && (
                    <tr className="bg-gray-900/60">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Monthly Rent</p>
                            {cf.rentMultiplier !== 1.0 && (
                              <p className="text-gray-500 text-xs">Base: ${cf.baseRent?.toLocaleString()} × {cf.rentMultiplier}x</p>
                            )}
                            <p className="text-white font-medium">${cf.rent.toLocaleString()} est. rent</p>
                            <p className="text-gray-400 text-xs">−${Math.round(cf.vacancyCost)} vacancy</p>
                            <p className="text-emerald-400 text-xs font-medium">
                              = ${Math.round(cf.effectiveRent ?? (cf.rent - cf.vacancyCost)).toLocaleString()} effective
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">PITI</p>
                            <p className="text-white font-medium">${Math.round(cf.piti).toLocaleString()}/mo</p>
                            <p className="text-gray-400 text-xs">P&amp;I ${Math.round(cf.pi).toLocaleString()}</p>
                            <p className="text-gray-400 text-xs">
                              Tax ${Math.round(cf.monthlyTax).toLocaleString()} · Ins ${Math.round(cf.monthlyIns).toLocaleString()}
                            </p>
                            <p className="text-gray-500 text-xs">Tax rate: {cf.taxRateUsed.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Reserves</p>
                            <p className="text-gray-400 text-xs">Maint. ${Math.round(cf.maintenance)}</p>
                            <p className="text-gray-400 text-xs">CapEx ${Math.round(cf.capex)}</p>
                            {cf.management > 0 && (
                              <p className="text-gray-400 text-xs">Mgmt. ${Math.round(cf.management)}</p>
                            )}
                            <p className="text-white text-xs font-medium">
                              Total ${Math.round(cf.totalReserves)}/mo
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Returns</p>
                            <p className={`font-bold text-lg ${cfColor(cf.monthlyCashFlow)}`}>
                              {cf.monthlyCashFlow >= 0 ? '+' : ''}${Math.round(cf.monthlyCashFlow).toLocaleString()}/mo
                            </p>
                            <p className={`text-sm font-semibold ${cocColor(cf.cashOnCash)}`}>
                              {cf.cashOnCash.toFixed(1)}% CoC
                            </p>
                            <p className="text-gray-400 text-xs">
                              Down: ${Math.round(cf.downAmount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5)             p = i + 1;
              else if (currentPage <= 3)       p = i + 1;
              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
              else                             p = currentPage - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded ${currentPage === p ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-900/30 text-xs text-gray-500 border-t border-gray-700">
        {cfMode ? (
          <>
            <strong className="text-gray-400">Cash-on-cash:</strong>
            <span className="text-emerald-400 ml-2">Excellent (10%+)</span>
            <span className="text-emerald-300 ml-2">Good (6–10%)</span>
            <span className="text-yellow-400 ml-2">Fair (2–6%)</span>
            <span className="text-orange-400 ml-2">Break-even (0–2%)</span>
            <span className="text-red-400 ml-2">Negative</span>
            <span className="text-gray-600 ml-4">· Click any row to expand full breakdown</span>
          </>
        ) : (
          <>
            <strong className="text-gray-400">Gross yield:</strong>
            <span className="text-green-400 ml-2">Excellent (10%+)</span>
            <span className="text-green-300 ml-2">Good (8–10%)</span>
            <span className="text-yellow-400 ml-2">Fair (6–8%)</span>
            <span className="text-orange-400 ml-2">Poor (4–6%)</span>
            <span className="text-red-400 ml-2">Very Poor (&lt;4%)</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ROITable;
