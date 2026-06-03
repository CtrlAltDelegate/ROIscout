/**
 * Unit tests for the cash flow calculator (frontend/src/utils/cashFlow.js).
 *
 * These tests run in Node without a DOM — they import the module directly
 * after stripping the ES module `export` keyword so Jest can load it.
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load the ES-module util into Jest (CJS-compatible) ───────────────────────
function loadCashFlowModule() {
  let src = fs.readFileSync(
    path.resolve(__dirname, '../../../frontend/src/utils/cashFlow.js'),
    'utf8'
  );
  // Strip ES module syntax so Node can eval it
  src = src
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+const\s+/gm, 'const ')
    .replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
  const mod = { exports: {} };
  const fn  = new Function('module', 'exports', 'require', src);
  // Expose named exports manually after eval
  const ctx = {};
  vm.runInNewContext(src, ctx);
  return ctx;
}

let cashFlowModule;
beforeAll(() => { cashFlowModule = loadCashFlowModule(); });

// ── monthlyPI ─────────────────────────────────────────────────────────────────
describe('monthlyPI', () => {
  test('returns 0 for zero principal', () => {
    expect(cashFlowModule.monthlyPI(0, 7, 30)).toBe(0);
  });

  test('returns 0 for zero rate', () => {
    expect(cashFlowModule.monthlyPI(200000, 0, 30)).toBe(0);
  });

  test('calculates correct payment for $200k at 7% / 30yr', () => {
    const payment = cashFlowModule.monthlyPI(200000, 7, 30);
    // Expected ≈ $1,330.60
    expect(payment).toBeCloseTo(1330.6, 0);
  });

  test('higher rate = higher payment', () => {
    const low  = cashFlowModule.monthlyPI(200000, 5,  30);
    const high = cashFlowModule.monthlyPI(200000, 10, 30);
    expect(high).toBeGreaterThan(low);
  });
});

// ── calcCashFlow ──────────────────────────────────────────────────────────────
describe('calcCashFlow', () => {
  const baseRow = {
    median_price: 150000,
    median_rent:  1400,
    state:        'IN',
    price_3br:    null,
    price_sfr:    null,
    rent_sfr:     null,
    hud_fmr_2br:  null,
    hud_fmr_3br:  null,
  };

  const baseParams = {
    downPct:        20,
    interestRate:   7.0,
    loanTermYears:  30,
    insuranceRate:  0.5,
    taxRateOverride: null,
    maintenancePct: 5,
    vacancyPct:     5,
    capexPct:       5,
    managementPct:  0,
    beds:           3,
    baths:          2,
  };

  test('returns null when no price data', () => {
    const row = { ...baseRow, median_price: 0 };
    expect(cashFlowModule.calcCashFlow(row, baseParams)).toBeNull();
  });

  test('returns null when no rent data', () => {
    const row = { ...baseRow, median_rent: 0 };
    expect(cashFlowModule.calcCashFlow(row, baseParams)).toBeNull();
  });

  test('returns a result object for valid inputs', () => {
    const result = cashFlowModule.calcCashFlow(baseRow, baseParams);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('monthlyCashFlow');
    expect(result).toHaveProperty('cashOnCash');
    expect(result).toHaveProperty('piti');
    expect(result).toHaveProperty('rent');
  });

  test('CoC is negative when rent is very low', () => {
    const row    = { ...baseRow, median_rent: 500 };
    const result = cashFlowModule.calcCashFlow(row, baseParams);
    expect(result.cashOnCash).toBeLessThan(0);
  });

  test('CoC is positive for a high-yield market', () => {
    // $60k house, $1,400/mo rent → strong cash flow
    const row    = { ...baseRow, median_price: 60000, median_rent: 1400 };
    const result = cashFlowModule.calcCashFlow(row, baseParams);
    expect(result.cashOnCash).toBeGreaterThan(0);
  });

  test('uses price_3br when available', () => {
    const row    = { ...baseRow, price_3br: 130000 };
    const result = cashFlowModule.calcCashFlow(row, baseParams);
    expect(result.price).toBe(130000);
  });

  test('property management increases expenses and reduces cash flow', () => {
    const noMgmt   = cashFlowModule.calcCashFlow(baseRow, { ...baseParams, managementPct: 0  });
    const withMgmt = cashFlowModule.calcCashFlow(baseRow, { ...baseParams, managementPct: 10 });
    expect(withMgmt.monthlyCashFlow).toBeLessThan(noMgmt.monthlyCashFlow);
  });

  test('downAmount = price × downPct / 100', () => {
    const result = cashFlowModule.calcCashFlow(baseRow, baseParams);
    expect(result.downAmount).toBeCloseTo(baseRow.median_price * 0.2, 0);
  });
});
