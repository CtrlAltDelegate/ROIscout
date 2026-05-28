/**
 * enrich-missing-states.js
 *
 * Fills rent + price data for states where Zillow ZORI has no zip-level
 * coverage (currently: AL, CT, DE, GA, IN, IA, ME, MD, MN, MS, NH, NJ,
 * OH, SD, VT).
 *
 * Strategy:
 *   Price → Zillow ZHVI zip-level CSV (national, free, no auth)
 *   Rent  → Zillow ZORI county-level CSV (national, free, no auth)
 *             matched to each zip via zip_data.county
 *           → falls back to state-level average if no county match
 *
 * Run once from project root:
 *   node backend/scripts/enrich-missing-states.js
 *
 * Safe to re-run: uses COALESCE so existing data is never overwritten.
 * Add to auto-refresh.js for annual updates.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios    = require('axios');
const { Pool } = require('pg');

const ZHVI_URL         = 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const COUNTY_ZORI_URL  = 'https://files.zillowstatic.com/research/public_csvs/zori/County_zori_uc_sfrcondomfr_sm_month.csv';

// States that have no zip-level ZORI coverage
const MISSING_STATES = new Set(['AL','CT','DE','GA','IN','IA','ME','MD','MN','MS','NH','NJ','OH','SD','VT']);

const BATCH = 200;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (const c of line) {
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** Zip-prefix → state code (same map used by freeDataSources.js) */
const { ZIP_PREFIX_TO_STATE } = require('../src/services/freeDataSources');

function stateFromZip(zip) {
  const prefix = String(zip).padStart(5, '0').slice(0, 3);
  return ZIP_PREFIX_TO_STATE[prefix] || null;
}

/** Download a Zillow CSV (large) and parse into rows. Returns array of {zip|county, state, rent|price}. */
async function downloadAndParse(url, mode) {
  console.log(`⬇️  Downloading ${mode} data…`);
  const res = await axios.get(url, { responseType: 'text', timeout: 120000 });
  const lines  = res.data.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);

  // Find columns
  const iRegion = header.findIndex(h => /RegionName/i.test(h));
  const iState  = header.findIndex(h => /^State$/i.test(h));
  const iSFips  = header.findIndex(h => /StateCodeFIPS/i.test(h));
  const iMFips  = header.findIndex(h => /MunicipalCodeFIPS/i.test(h));
  // Latest date column
  const dateCols = header.map((h, i) => ({ h, i })).filter(({ h }) => /^\d{4}-\d{2}-\d{2}$/.test(h));
  const iVal    = dateCols.length ? dateCols[dateCols.length - 1].i : -1;

  console.log(`   Latest column: ${header[iVal]} | total rows: ${lines.length - 1}`);

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const row  = parseCsvLine(lines[i]);
    const val  = iVal >= 0 ? parseFloat(row[iVal]) : NaN;
    if (!val || isNaN(val) || val <= 0) continue;

    const region = (row[iRegion] || '').trim();
    const state  = iState >= 0 ? (row[iState] || '').trim().toUpperCase().slice(0, 2) : null;

    if (mode === 'zhvi-zip') {
      const zip = region.replace(/\D/g, '').slice(0, 5);
      if (zip.length !== 5) continue;
      const zipState = stateFromZip(zip) || state;
      if (!MISSING_STATES.has(zipState)) continue; // only process missing states
      results.push({ zip, state: zipState, price: Math.round(val) });

    } else if (mode === 'county-zori') {
      // county ZORI: RegionName = county name, State = 2-letter code
      const county = region; // e.g. "Marion County"
      if (!state || !county) continue;
      results.push({ county, state, rent: Math.round(val) });
    }
  }
  return results;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏗️  Enriching missing states with Zillow ZHVI + county ZORI…');
  console.log(`   Missing states: ${[...MISSING_STATES].join(', ')}\n`);

  // 1. Download ZHVI zip prices for missing states
  const zhviRows = await downloadAndParse(ZHVI_URL, 'zhvi-zip');
  console.log(`   ${zhviRows.length.toLocaleString()} zips in missing states found in ZHVI\n`);

  // 2. Download county-level ZORI rents
  const countryZoriRows = await downloadAndParse(COUNTY_ZORI_URL, 'county-zori');
  console.log(`   ${countryZoriRows.length.toLocaleString()} county rent rows downloaded\n`);

  // 3. Build lookup maps
  // county map: "IN|Marion County" → rent
  const countyRentMap = new Map();
  // state map: "IN" → [rents] (for averaging)
  const stateRents    = new Map();

  for (const { county, state, rent } of countryZoriRows) {
    countyRentMap.set(`${state}|${county}`, rent);
    if (!stateRents.has(state)) stateRents.set(state, []);
    stateRents.get(state).push(rent);
  }

  // State average rents
  const stateAvgRent = new Map();
  for (const [state, rents] of stateRents) {
    stateAvgRent.set(state, Math.round(rents.reduce((a, b) => a + b, 0) / rents.length));
  }

  console.log('📊 State average rents (county ZORI):');
  for (const s of MISSING_STATES) {
    console.log(`   ${s}: $${stateAvgRent.get(s) || 'no data'}/mo`);
  }

  // 4. Fetch county data for zips in missing states from our DB
  const { rows: dbZips } = await pool.query(`
    SELECT zip_code, state, county FROM zip_data
    WHERE state = ANY($1)
  `, [[...MISSING_STATES]]);

  const dbCountyMap = new Map(); // zip → county name
  for (const row of dbZips) {
    dbCountyMap.set(row.zip_code, row.county || null);
  }

  // 5. Build final upsert rows
  const upsertRows = [];
  let countyCoverage = 0;
  let stateFallback  = 0;
  let noRent         = 0;

  for (const { zip, state, price } of zhviRows) {
    const county  = dbCountyMap.get(zip) || null;
    const cKey    = county ? `${state}|${county}` : null;
    let rent      = cKey ? countyRentMap.get(cKey) : null;

    if (!rent) {
      // Try partial county match (sometimes "Marion" vs "Marion County")
      if (county) {
        // search for any key containing this state and starts with the county base name
        const base = county.replace(/ County$| Parish$| Borough$| Census Area$/i, '').trim();
        const fullKey = `${state}|${base} County`;
        rent = countyRentMap.get(fullKey) ||
               countyRentMap.get(`${state}|${base} Parish`) ||
               countyRentMap.get(`${state}|${base}`);
      }
    }

    if (rent) {
      countyCoverage++;
    } else {
      rent = stateAvgRent.get(state);
      if (rent) stateFallback++;
      else { noRent++; continue; }
    }

    // Derived metrics
    const rentToPrice = price > 0 ? parseFloat((rent / price).toFixed(4)) : null;
    const yield_pct   = price > 0 ? parseFloat(((rent * 12 / price) * 100).toFixed(2)) : null;
    const grm_val     = rent  > 0 ? parseFloat((price / (rent * 12)).toFixed(2)) : null;

    upsertRows.push({ zip, state, rent, price, rentToPrice, yield_pct, grm_val });
  }

  console.log(`\n📦 ${upsertRows.length.toLocaleString()} zip codes to upsert:`);
  console.log(`   County-level rent:  ${countyCoverage.toLocaleString()}`);
  console.log(`   State avg fallback: ${stateFallback.toLocaleString()}`);
  console.log(`   No rent data:       ${noRent.toLocaleString()}`);

  if (upsertRows.length === 0) {
    console.log('\n⚠️  Nothing to upsert. Check that county data has been enriched first.');
    return;
  }

  // 6. Upsert in batches
  let inserted = 0;
  for (let i = 0; i < upsertRows.length; i += BATCH) {
    const batch  = upsertRows.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let p = 1;

    for (const r of batch) {
      values.push(`($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++})`);
      params.push(r.zip, r.state, r.price, r.rent, r.rentToPrice, r.yield_pct, r.grm_val);
    }

    await pool.query(
      `INSERT INTO zip_data (zip_code, state, median_price, median_rent, rent_to_price_ratio, gross_rental_yield, grm)
       VALUES ${values.join(',')}
       ON CONFLICT (zip_code, state) DO UPDATE SET
         median_price        = COALESCE(EXCLUDED.median_price,        zip_data.median_price),
         median_rent         = COALESCE(EXCLUDED.median_rent,         zip_data.median_rent),
         rent_to_price_ratio = COALESCE(EXCLUDED.rent_to_price_ratio, zip_data.rent_to_price_ratio),
         gross_rental_yield  = COALESCE(EXCLUDED.gross_rental_yield,  zip_data.gross_rental_yield),
         grm                 = COALESCE(EXCLUDED.grm,                 zip_data.grm),
         last_updated        = NOW()`,
      params
    );

    inserted += batch.length;
    process.stdout.write(`\r   Upserted: ${inserted.toLocaleString()} / ${upsertRows.length.toLocaleString()}`);
  }

  // 7. Summary
  console.log('\n');
  const { rows: [summary] } = await pool.query(`
    SELECT state, COUNT(*) zips,
           ROUND(AVG(median_price)) avg_price,
           ROUND(AVG(median_rent))  avg_rent,
           ROUND(AVG(gross_rental_yield)::numeric, 2) avg_yield
    FROM zip_data
    WHERE state = ANY($1) AND median_price > 0 AND median_rent > 0
    GROUP BY state ORDER BY state
  `, [[...MISSING_STATES]]);

  const { rows: statRows } = await pool.query(`
    SELECT state, COUNT(*) zips,
           ROUND(AVG(median_price)) avg_price,
           ROUND(AVG(median_rent))  avg_rent,
           ROUND(AVG(gross_rental_yield)::numeric, 2) avg_yield
    FROM zip_data
    WHERE state = ANY($1) AND median_price > 0 AND median_rent > 0
    GROUP BY state ORDER BY state
  `, [[...MISSING_STATES]]);

  console.log('\n✅ Done! Coverage by state:');
  console.log('   State  Zips   Avg Price  Avg Rent  Avg Yield');
  for (const row of statRows) {
    console.log(`   ${row.state}     ${String(row.zips).padEnd(6)} $${Number(row.avg_price).toLocaleString().padEnd(10)} $${Number(row.avg_rent).toLocaleString().padEnd(9)} ${row.avg_yield}%`);
  }
}

main()
  .then(() => pool.end())
  .catch(err => { console.error('\n❌', err.message); pool.end(); process.exit(1); });
