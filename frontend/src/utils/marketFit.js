/**
 * Market Fit — estimates what price percentile a given budget represents
 * in a market, then classifies it into an A/B/C/D property class.
 *
 * The sweet spot for buy-and-hold investors is the 40th–75th percentile
 * (B-class): stable working/middle-class tenants, lower turnover, and
 * manageable maintenance costs. Below that (C/D) brings tenant quality
 * risk; above that (A) brings thin tenant pools and poor yields.
 *
 * Percentile anchors are derived from empirical Zillow ZHVI distributions
 * across US markets — the ratio (budget / median) maps to these percentiles:
 *
 *   Ratio  →  ~Percentile
 *   0.45      5th
 *   0.55      10th
 *   0.73      25th
 *   0.90      40th   ← bottom of sweet spot
 *   1.00      50th   (median)
 *   1.11      60th
 *   1.45      75th   ← top of sweet spot
 *   1.90      90th
 *   2.30      95th
 */

const ANCHORS = [
  { pct:  5, ratio: 0.45 },
  { pct: 10, ratio: 0.55 },
  { pct: 25, ratio: 0.73 },
  { pct: 40, ratio: 0.90 },
  { pct: 50, ratio: 1.00 },
  { pct: 60, ratio: 1.11 },
  { pct: 75, ratio: 1.45 },
  { pct: 90, ratio: 1.90 },
  { pct: 95, ratio: 2.30 },
];

/**
 * @param {number} budget      - investor's max purchase price
 * @param {number} medianPrice - median home price for the zip/market
 * @returns {{ percentile: number, classLabel: 'A'|'B'|'C'|'D', isSweetSpot: boolean, ratio: number } | null}
 */
export function getMarketFit(budget, medianPrice) {
  if (!budget || !medianPrice || medianPrice <= 0 || budget <= 0) return null;

  const ratio = budget / medianPrice;

  // Interpolate to find approximate percentile
  let percentile;
  if (ratio <= ANCHORS[0].ratio) {
    percentile = 0;
  } else if (ratio >= ANCHORS[ANCHORS.length - 1].ratio) {
    percentile = 99;
  } else {
    for (let i = 0; i < ANCHORS.length - 1; i++) {
      const lo = ANCHORS[i];
      const hi = ANCHORS[i + 1];
      if (ratio >= lo.ratio && ratio <= hi.ratio) {
        const t = (ratio - lo.ratio) / (hi.ratio - lo.ratio);
        percentile = lo.pct + t * (hi.pct - lo.pct);
        break;
      }
    }
  }

  percentile = Math.round(percentile);

  let classLabel;
  if (percentile >= 75)       classLabel = 'A'; // luxury — thin tenant pool
  else if (percentile >= 40)  classLabel = 'B'; // sweet spot
  else if (percentile >= 25)  classLabel = 'C'; // workable, elevated risk
  else                        classLabel = 'D'; // avoid

  const isSweetSpot = classLabel === 'B';

  return { percentile, classLabel, isSweetSpot, ratio };
}

/** Derive the investor's max purchase price from cashFlowParams */
export function budgetFromParams(params) {
  if (!params) return 0;
  const down = Number(params.downBudget) || 0;
  const pct  = Number(params.downPct)    || 0;
  return pct > 0 ? down / (pct / 100) : 0;
}
