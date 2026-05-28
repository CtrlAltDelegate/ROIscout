/**
 * cashFlow.js — Investor-personalised cash-flow calculations.
 *
 * Given a zip code's median_price + median_rent and the investor's
 * financing/expense assumptions, returns monthly breakdown and
 * cash-on-cash return.
 */

// Effective property tax rates by state (Tax Foundation 2024, % of home value)
export const STATE_TAX_RATES = {
  AL: 0.41, AK: 1.04, AZ: 0.62, AR: 0.62, CA: 0.73, CO: 0.55, CT: 1.79,
  DE: 0.57, FL: 0.89, GA: 0.87, HI: 0.32, ID: 0.69, IL: 2.23, IN: 0.83,
  IA: 1.50, KS: 1.39, KY: 0.86, LA: 0.56, ME: 1.36, MD: 1.09, MA: 1.23,
  MI: 1.54, MN: 1.11, MS: 0.75, MO: 0.97, MT: 0.84, NE: 1.67, NV: 0.59,
  NH: 2.09, NJ: 2.49, NM: 0.80, NY: 1.73, NC: 0.80, ND: 0.98, OH: 1.59,
  OK: 0.90, OR: 0.91, PA: 1.58, RI: 1.53, SC: 0.57, SD: 1.22, TN: 0.71,
  TX: 1.74, UT: 0.63, VT: 1.83, VA: 0.87, WA: 0.93, WV: 0.59, WI: 1.85,
  WY: 0.58,
};

/**
 * Monthly P&I using standard amortisation formula.
 * @param {number} principal  Loan amount in dollars
 * @param {number} annualRate Annual interest rate, e.g. 7.25 for 7.25%
 * @param {number} termYears  Loan term (default 30)
 */
export function monthlyPI(principal, annualRate, termYears = 30) {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Full cash-flow breakdown for one zip code row.
 *
 * @param {object} row    zip_data row: { median_price, median_rent, state, ... }
 * @param {object} params Investor parameters (see defaults below)
 * @returns {object} breakdown + derived metrics
 */
export function calcCashFlow(row, params) {
  const {
    downPct        = 20,      // % down payment
    interestRate   = 7.25,    // annual interest rate %
    loanTermYears  = 30,
    insuranceRate  = 0.50,    // annual insurance as % of home value
    taxRateOverride= null,    // if set, overrides state lookup
    maintenancePct = 5,       // % of monthly rent
    vacancyPct     = 5,       // % of monthly rent (lost rent)
    capexPct       = 5,       // % of monthly rent
    managementPct  = 0,       // % of monthly rent (0 = self-managed)
  } = params;

  const price = Number(row.median_price);
  const rent  = Number(row.median_rent);
  if (!price || !rent) return null;

  // Financing
  const downAmount   = price * (downPct / 100);
  const loanAmount   = price - downAmount;
  const pi           = monthlyPI(loanAmount, interestRate, loanTermYears);

  // PITI
  const taxRate      = taxRateOverride != null ? taxRateOverride : (STATE_TAX_RATES[row.state] ?? 1.0);
  const monthlyTax   = price * (taxRate / 100) / 12;
  const monthlyIns   = price * (insuranceRate / 100) / 12;
  const piti         = pi + monthlyTax + monthlyIns;

  // Operating reserves (as % of gross rent)
  const vacancyCost  = rent * (vacancyPct / 100);
  const maintenance  = rent * (maintenancePct / 100);
  const capex        = rent * (capexPct / 100);
  const management   = rent * (managementPct / 100);
  const totalReserves= vacancyCost + maintenance + capex + management;

  // Net cash flow
  const effectiveRent      = rent - vacancyCost; // rent after vacancy loss
  const totalMonthlyExpenses = piti + maintenance + capex + management;
  const monthlyCashFlow    = effectiveRent - totalMonthlyExpenses;
  const annualCashFlow     = monthlyCashFlow * 12;

  // Returns
  const cashOnCash         = downAmount > 0 ? (annualCashFlow / downAmount) * 100 : 0;
  const maxAffordablePrice = downAmount > 0 ? downAmount / (downPct / 100) : 0;

  return {
    price,
    rent,
    downAmount,
    loanAmount,
    pi,
    monthlyTax,
    monthlyIns,
    piti,
    vacancyCost,
    maintenance,
    capex,
    management,
    totalReserves,
    effectiveRent,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCash,
    maxAffordablePrice,
    taxRateUsed: taxRate,
  };
}
