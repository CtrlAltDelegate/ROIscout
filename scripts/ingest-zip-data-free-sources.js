#!/usr/bin/env node

/**
 * Data Pipeline: Free Sources Integration (Launch Readiness - Critical Path)
 *
 * Populates zip_data from:
 * - Zillow ZHVI (home values) + ZORI (rents) monthly CSVs
 * - Optional: Census ACS API (median value + gross rent by ZCTA)
 * - Optional: HUD FMR or zip→state/county lookup CSV
 *
 * Run from repo root with .env loaded (e.g. from backend or root):
 *   node scripts/ingest-zip-data-free-sources.js [options]
 *
 * Options:
 *   --zhvi <path>     Path or URL to Zillow ZHVI Zip-level CSV (required unless --census-only)
 *   --zori <path>    Path or URL to Zillow ZORI Zip-level CSV (required unless --census-only)
 *   --zip-lookup <path>  Optional CSV: zip_code,state,county for state/county
 *   --census         Also fetch Census ACS (requires CENSUS_API_KEY) to fill gaps
 *   --census-only    Use only Census ACS (no Zillow); requires CENSUS_API_KEY
 *   --limit <n>      Max zips to upsert (default: no limit)
 *   --min-zips <n>   Fail if fewer than N zips loaded (default: 0; use 500 for beta)
 *   --dry-run        Do not write to DB; only load and report
 *   --help           Show this help
 *
 * Env:
 *   DATABASE_URL     PostgreSQL connection string
 *   CENSUS_API_KEY   Optional; get from https://api.census.gov/data/key_signup.html
 *   ZHVI_CSV_PATH   Default path for ZHVI if --zhvi not set
 *   ZORI_CSV_PATH   Default path for ZORI if --zori not set
 */

const path = require('path');
const fs = require('fs');

// When run via backend (e.g. npm run ingest:zip from backend), use backend's node_modules
const backendNodeModules = path.resolve(__dirname, '..', 'backend', 'node_modules');
if (fs.existsSync(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
} catch (_) {
  // dotenv optional when run from repo root (use backend/.env via shell or run from backend)
}

const { Pool } = require('pg');
const {
  loadZillowZhvi,
  loadZillowZori,
  loadCensusAcs,
  loadZipStateCountyCsv,
  getStateFromZip,
} = require('../backend/src/services/freeDataSources');

function roundRatio(v) {
  return v == null ? null : Math.round(v * 10000) / 10000;
}
function roundYield(v) {
  return v == null ? null : Math.round(v * 100) / 100;
}
function roundGrm(v) {
  return v == null ? null : Math.round(v * 100) / 100;
}

function calculateMetrics(medianPrice, medianRent) {
  if (!medianPrice || !medianRent || medianPrice <= 0 || medianRent <= 0) {
    return { rentToPriceRatio: null, grossRentalYield: null, grm: null };
  }
  const annualRent = medianRent * 12;
  return {
    rentToPriceRatio: roundRatio(annualRent / medianPrice),
    grossRentalYield: roundYield((annualRent / medianPrice) * 100),
    grm: roundGrm(medianPrice / annualRent),
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    zhvi: process.env.ZHVI_CSV_PATH || null,
    zori: process.env.ZORI_CSV_PATH || null,
    zipLookup: process.env.ZIP_LOOKUP_CSV_PATH || null,
    census: false,
    censusOnly: false,
    limit: null,
    minZips: 0,
    dryRun: false,
  };
  if (process.argv.includes('--dry-run')) opts.dryRun = true;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--zhvi':
        opts.zhvi = args[++i] || opts.zhvi;
        break;
      case '--zori':
        opts.zori = args[++i] || opts.zori;
        break;
      case '--zip-lookup':
        opts.zipLookup = args[++i] || opts.zipLookup;
        break;
      case '--census':
        opts.census = true;
        break;
      case '--census-only':
        opts.censusOnly = true;
        break;
      case '--limit':
        opts.limit = parseInt(args[++i], 10);
        break;
      case '--min-zips':
        opts.minZips = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--help':
        console.log(require('fs').readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?Options:[\s\S]*?--help[\s\S]*?\*\//)[0]);
        process.exit(0);
      default:
        break;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  const repoRoot = path.resolve(__dirname, '..');
  if (!opts.zhvi && process.env.ZHVI_CSV_PATH) opts.zhvi = process.env.ZHVI_CSV_PATH;
  if (!opts.zori && process.env.ZORI_CSV_PATH) opts.zori = process.env.ZORI_CSV_PATH;
  if (!opts.zhvi) opts.zhvi = path.join(repoRoot, 'data', 'Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv');
  if (!opts.zori) opts.zori = path.join(repoRoot, 'data', 'Zip_zori_uc_sfrcondomfr_sm_month.csv');

  if (!opts.censusOnly && (!opts.zhvi || !opts.zori)) {
    console.error('Missing required inputs. Provide --zhvi and --zori paths (or set ZHVI_CSV_PATH, ZORI_CSV_PATH).');
    console.error('Or place Zillow CSVs in data/ and run from repo root. See data/README.md.');
    console.error('Download Zillow ZIP-level CSVs from: https://www.zillow.com/research/data/');
    console.error('  - ZHVI: Home Values → Geography "ZIP Code" → Download');
    console.error('  - ZORI: Rentals → Geography "ZIP Codes" → Download');
    process.exit(1);
  }

  if (opts.censusOnly && !process.env.CENSUS_API_KEY) {
    console.error('--census-only requires CENSUS_API_KEY. Get a key at https://api.census.gov/data/key_signup.html');
    process.exit(1);
  }

  const db = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    : null;

  if (!opts.dryRun && !db) {
    console.error('DATABASE_URL is required unless --dry-run');
    process.exit(1);
  }

  console.log('Data Pipeline: Free Sources → zip_data');
  console.log('Options:', { ...opts, dryRun: opts.dryRun });

  let zhviRows = [];
  let zoriRows = [];
  let censusRows = [];
  let zipLookup = new Map();

  if (opts.zipLookup) {
    console.log('Loading zip→state/county lookup:', opts.zipLookup);
    zipLookup = await loadZipStateCountyCsv(opts.zipLookup);
    console.log('  Loaded', zipLookup.size, 'zip lookups');
  }

  if (!opts.censusOnly) {
    console.log('Loading Zillow ZHVI:', opts.zhvi);
    zhviRows = await loadZillowZhvi(opts.zhvi);
    console.log('  Rows:', zhviRows.length);

    console.log('Loading Zillow ZORI:', opts.zori);
    zoriRows = await loadZillowZori(opts.zori);
    console.log('  Rows:', zoriRows.length);
  }

  if (opts.censusOnly || opts.census) {
    console.log('Loading Census ACS (by state)...');
    try {
      censusRows = await loadCensusAcs({
        apiKey: process.env.CENSUS_API_KEY,
        onError: (state, err) => console.warn('  Census state', state, err.message),
      });
      console.log('  Rows:', censusRows.length);
    } catch (e) {
      console.warn('Census load failed:', e.message);
      if (opts.censusOnly) {
        console.error('Cannot continue with --census-only');
        process.exit(1);
      }
    }
  }

  const zhviByZip = new Map(zhviRows.map((r) => [r.zipCode, { value: r.value, state: r.state }]));
  const zoriByZip = new Map(zoriRows.map((r) => [r.zipCode, { value: r.value, state: r.state }]));
  const censusByZip = new Map(
    censusRows.map((r) => [
      r.zipCode,
      {
        medianValue: r.medianValue,
        medianRent: r.medianRent,
        state: r.state,
      },
    ])
  );

  const merged = new Map();
  const zipSet = new Set([
    ...zhviByZip.keys(),
    ...zoriByZip.keys(),
    ...censusByZip.keys(),
  ]);

  for (const zip of zipSet) {
    const lookup = zipLookup.get(zip);
    let state = (lookup && lookup.state) || getStateFromZip(zip);
    let county = lookup && lookup.county ? lookup.county : null;

    let medianPrice = null;
    let medianRent = null;

    if (!opts.censusOnly) {
      const zhvi = zhviByZip.get(zip);
      const zori = zoriByZip.get(zip);
      if (zhvi) {
        medianPrice = zhvi.value;
        if (!state && zhvi.state) state = zhvi.state;
      }
      if (zori) {
        medianRent = zori.value;
        if (!state && zori.state) state = zori.state;
      }
    }

    const census = censusByZip.get(zip);
    if (census) {
      if (medianPrice == null && census.medianValue != null) medianPrice = census.medianValue;
      if (medianRent == null && census.medianRent != null) medianRent = census.medianRent;
      if (!state && census.state) state = census.state;
    }

    if (!state) state = getStateFromZip(zip) || 'US';
    if (!medianPrice && !medianRent) continue;
    if (!medianPrice || !medianRent) continue;

    const metrics = calculateMetrics(medianPrice, medianRent);
    merged.set(zip, {
      zip_code: zip,
      state: state.toUpperCase().slice(0, 2),
      county,
      median_price: Math.round(medianPrice),
      median_rent: Math.round(medianRent),
      rent_to_price_ratio: metrics.rentToPriceRatio,
      gross_rental_yield: metrics.grossRentalYield,
      grm: metrics.grm,
    });
  }

  let list = Array.from(merged.values());
  if (opts.limit != null && opts.limit > 0) {
    list = list.slice(0, opts.limit);
  }

  if (list.length < opts.minZips) {
    console.error(`Fewer than ${opts.minZips} zips (got ${list.length}). Failing.`);
    process.exit(1);
  }

  console.log('Merged rows ready for zip_data:', list.length);

  if (opts.dryRun) {
    console.log('Dry run: sample rows (first 5):');
    list.slice(0, 5).forEach((r) => console.log(' ', r));
    console.log('Exiting without writing to DB.');
    process.exit(0);
  }

  const client = await db.connect();
  const now = new Date();
  let affected = 0;

  try {
    for (const row of list) {
      await client.query(
        `INSERT INTO zip_data (
          zip_code, state, county, median_price, median_rent,
          rent_to_price_ratio, gross_rental_yield, grm, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (zip_code, state)
        DO UPDATE SET
          county = EXCLUDED.county,
          median_price = EXCLUDED.median_price,
          median_rent = EXCLUDED.median_rent,
          rent_to_price_ratio = EXCLUDED.rent_to_price_ratio,
          gross_rental_yield = EXCLUDED.gross_rental_yield,
          grm = EXCLUDED.grm,
          last_updated = EXCLUDED.last_updated`,
        [
          row.zip_code,
          row.state,
          row.county,
          row.median_price,
          row.median_rent,
          row.rent_to_price_ratio,
          row.gross_rental_yield,
          row.grm,
          now,
        ]
      );
      affected++;
    }
  } finally {
    client.release();
    await db.end();
  }

  console.log('Done. Rows upserted:', affected);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
