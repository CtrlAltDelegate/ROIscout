import React, { useState, useMemo } from 'react';
import DataFreshnessBadge from '../Shared/DataFreshnessBadge';
import { calcCashFlow } from '../../utils/cashFlow';

/** Format a growth rate with +/- sign and color */
const GrowthBadge = ({ value, label }) => {
  if (value == null) return <span className="text-gray-600 text-xs">—</span>;
  const n = Number(value);
  const color = n >= 3 ? 'text-emerald-400' : n >= 0 ? 'text-yellow-400' : 'text-red-400';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {n >= 0 ? '+' : ''}{n.toFixed(1)}%{label ? <span className="text-gray-500 font-normal ml-0.5">{label}</span> : null}
    </span>
  );
};

/** Market health dot indicator */
const MarketDot = ({ row }) => {
  const dom  = Number(row.days_on_market);
  const heat = Number(row.market_heat_index);
  const cut  = Number(row.price_cut_pct);
  if (!dom && !heat) return null;
  // Hot market = low DOM + high heat + low price cuts
  const score = (heat > 60 ? 2 : heat > 40 ? 1 : 0)
              + (dom > 0 && dom < 20 ? 2 : dom < 35 ? 1 : 0)
              + (cut < 15 ? 1 : 0);
  const color = score >= 4 ? 'bg-red-400' : score >= 2 ? 'bg-yellow-400' : 'bg-emerald-400';
  const label = score >= 4 ? 'Hot' : score >= 2 ? 'Warm' : 'Balanced';
  return (
    <span className="ml-1.5 inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} />
      <span className="text-gray-500 text-xs">{label}</span>
    </span>
  );
};

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
              <th className={`${thCls} text-left`} onClick={() => handleSort('state')}>
                State {getSortIcon('state')}
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
                    className="hover:bg-gray-700/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : `${row.zip_code}-${index}`)}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {row.zip_code}
                      <span className="ml-1.5 text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm font-medium">
                      {row.state}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {row.county}
                      <MarketDot row={row} />
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      ${(cfMode && cf ? cf.price : Number(row.median_price) || 0).toLocaleString()}
                      {cfMode && cf && (
                        <span className="text-gray-500 text-xs ml-1">
                          {cf.price !== Number(row.median_price) ? `(${cf.beds}BR)` : '(all homes)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      ${(cfMode && cf ? cf.rent : Number(row.median_rent) || 0).toLocaleString()}
                    </td>

                    {cfMode ? (
                      <>
                        <td className={`px-4 py-3 text-right font-semibold ${cfColor(cf?.monthlyCashFlow ?? 0)}`}>
                          {cf ? `${cf.monthlyCashFlow >= 0 ? '+' : ''}$${Math.round(cf.monthlyCashFlow).toLocaleString()}` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-base ${cocColor(cf?.cashOnCash ?? 0)}`}>
                          {cf ? `${cf.cashOnCash.toFixed(1)}%` : '—'}
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

                  {/* Expanded detail row — all modes */}
                  {isExpanded && (
                    <tr className="bg-gray-900/60">
                      <td colSpan={cfMode ? 7 : 8} className="px-6 py-5">
                        <div className="space-y-4">

                          {/* CF breakdown (CF mode only) — waterfall order */}
                          {cfMode && cf && (
                            <div>
                              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">Cash Flow Waterfall</p>
                              <div className="space-y-1.5 text-sm max-w-sm">
                                {/* Gross Rent */}
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-300 font-medium">
                                    Gross Rent
                                    {cf.rentMultiplier !== 1.0 && (
                                      <span className="text-gray-500 text-xs ml-1">(base ${cf.baseRent?.toLocaleString()} × {cf.rentMultiplier.toFixed(2)}x)</span>
                                    )}
                                  </span>
                                  <span className="text-white font-semibold">${cf.rent.toLocaleString()}</span>
                                </div>
                                {/* Property Management */}
                                {cf.management > 0 && (
                                  <div className="flex justify-between items-center text-gray-400">
                                    <span className="pl-3">− Property Management</span>
                                    <span>−${Math.round(cf.management).toLocaleString()}</span>
                                  </div>
                                )}
                                {/* Maintenance */}
                                <div className="flex justify-between items-center text-gray-400">
                                  <span className="pl-3">− Repairs &amp; Maintenance</span>
                                  <span>−${Math.round(cf.maintenance).toLocaleString()}</span>
                                </div>
                                {/* CapEx */}
                                <div className="flex justify-between items-center text-gray-400">
                                  <span className="pl-3">− Capital Expenditures</span>
                                  <span>−${Math.round(cf.capex).toLocaleString()}</span>
                                </div>
                                {/* Vacancy */}
                                <div className="flex justify-between items-center text-gray-400">
                                  <span className="pl-3">− Vacancy</span>
                                  <span>−${Math.round(cf.vacancyCost).toLocaleString()}</span>
                                </div>
                                {/* Available for debt service */}
                                <div className="flex justify-between items-center border-t border-gray-700 pt-1.5 mt-1">
                                  <span className="text-gray-300 text-xs">Available for debt service</span>
                                  <span className="text-gray-200 font-medium">${Math.round(cf.netAfterVacancy ?? (cf.rent - cf.management - cf.maintenance - cf.capex - cf.vacancyCost)).toLocaleString()}</span>
                                </div>
                                {/* PITI */}
                                <div className="flex justify-between items-center text-gray-400">
                                  <span className="pl-3">
                                    − PITI
                                    <span className="text-gray-600 text-xs ml-1">(P&amp;I ${Math.round(cf.pi).toLocaleString()} · Tax ${Math.round(cf.monthlyTax).toLocaleString()} · Ins ${Math.round(cf.monthlyIns).toLocaleString()})</span>
                                  </span>
                                  <span>−${Math.round(cf.piti).toLocaleString()}</span>
                                </div>
                                {/* Net Cash Flow */}
                                <div className={`flex justify-between items-center border-t border-gray-600 pt-2 mt-1`}>
                                  <span className="font-semibold text-gray-200">Monthly Profit</span>
                                  <span className={`font-bold text-lg ${cfColor(cf.monthlyCashFlow)}`}>
                                    {cf.monthlyCashFlow >= 0 ? '+' : ''}${Math.round(cf.monthlyCashFlow).toLocaleString()}
                                  </span>
                                </div>
                                {/* CoC */}
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span>Annual profit / ${Math.round(cf.downAmount).toLocaleString()} down</span>
                                  <span className={`font-bold text-base ${cocColor(cf.cashOnCash)}`}>{cf.cashOnCash.toFixed(1)}% CoC</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Metro */}
                          {row.metro && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Metro Area</p>
                              <p className="text-gray-300 text-sm">{row.metro}</p>
                            </div>
                          )}

                          {/* Price & Rent Trends */}
                          {(row.price_growth_1yr != null || row.rent_growth_1yr != null) && (
                            <div>
                              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Price &amp; Rent Trends</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs mb-0.5">Price Growth 1yr</p>
                                  <GrowthBadge value={row.price_growth_1yr} />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-0.5">Price Growth 5yr</p>
                                  <GrowthBadge value={row.price_growth_5yr} />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-0.5">Rent Growth 1yr</p>
                                  <GrowthBadge value={row.rent_growth_1yr} />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-0.5">Rent Growth 3yr</p>
                                  <GrowthBadge value={row.rent_growth_3yr} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Market Health */}
                          {(row.days_on_market != null || row.market_heat_index != null) && (
                            <div>
                              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Market Conditions</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                {row.days_on_market != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Days to Pending</p>
                                    <p className="text-white font-medium">{Math.round(row.days_on_market)} days</p>
                                  </div>
                                )}
                                {row.market_heat_index != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Market Heat Index</p>
                                    <p className="text-white font-medium">{Number(row.market_heat_index).toFixed(1)}</p>
                                    <p className="text-gray-500 text-xs">{Number(row.market_heat_index) > 60 ? 'Seller\'s market' : Number(row.market_heat_index) > 40 ? 'Neutral' : 'Buyer\'s market'}</p>
                                  </div>
                                )}
                                {row.price_cut_pct != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Listings w/ Price Cut</p>
                                    <p className="text-white font-medium">{Number(row.price_cut_pct).toFixed(1)}%</p>
                                  </div>
                                )}
                                {row.sale_to_list_ratio != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Sale-to-List Ratio</p>
                                    <p className="text-white font-medium">{(Number(row.sale_to_list_ratio) * 100).toFixed(1)}%</p>
                                  </div>
                                )}
                                {row.for_sale_inventory != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">For-Sale Inventory</p>
                                    <p className="text-white font-medium">{Number(row.for_sale_inventory).toLocaleString()}</p>
                                  </div>
                                )}
                                {row.new_listings_count != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">New Listings/Mo</p>
                                    <p className="text-white font-medium">{Number(row.new_listings_count).toLocaleString()}</p>
                                  </div>
                                )}
                                {row.median_list_price != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Median List Price</p>
                                    <p className="text-white font-medium">${Number(row.median_list_price).toLocaleString()}</p>
                                  </div>
                                )}
                                {row.renter_affordability != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Renter Affordability</p>
                                    <p className={`font-medium ${Number(row.renter_affordability) > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                                      {Number(row.renter_affordability).toFixed(1)}% of income
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Demographics */}
                          {(row.median_household_income != null || row.population != null) && (
                            <div>
                              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Demographics</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                {row.median_household_income != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Median HH Income</p>
                                    <p className="text-white font-medium">${Number(row.median_household_income).toLocaleString()}</p>
                                  </div>
                                )}
                                {row.rent_to_income_ratio != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Rent-to-Income</p>
                                    <p className={`font-medium ${Number(row.rent_to_income_ratio) > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                                      {Number(row.rent_to_income_ratio).toFixed(1)}%
                                    </p>
                                    <p className="text-gray-500 text-xs">{Number(row.rent_to_income_ratio) > 30 ? 'Cost-burdened' : 'Affordable'}</p>
                                  </div>
                                )}
                                {row.population != null && (
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Population</p>
                                    <p className="text-white font-medium">{Number(row.population).toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bedroom Price Ladder */}
                          {(row.price_1br != null || row.price_3br != null) && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Median Home Price by Bedrooms</p>
                              <div className="flex flex-wrap gap-3">
                                {[
                                  { label: '1BR', val: row.price_1br },
                                  { label: '2BR', val: row.price_2br },
                                  { label: '3BR', val: row.price_3br },
                                  { label: '4BR', val: row.price_4br },
                                  { label: '5BR+', val: row.price_5br },
                                  { label: 'SFR', val: row.price_sfr },
                                ].filter(r => r.val != null).map(({ label, val }) => (
                                  <div key={label} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center min-w-[70px]">
                                    <p className="text-gray-400 text-xs">{label}</p>
                                    <p className="text-white font-semibold text-sm">${Math.round(val / 1000)}k</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
            <span className="text-gray-600 ml-4">· Click any row to expand market details</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ROITable;
