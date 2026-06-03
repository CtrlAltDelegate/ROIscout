#!/usr/bin/env node
/**
 * Update median_rent with Zillow Seasonally-Adjusted ZORI (zip-level).
 *
 * Why SA?  Removes seasonal swings (summer peaks, winter dips) so rent
 * figures reflect the underlying market trend rather than calendar timing.
 *
 * Steps:
 *   1. Go to https://www.zillow.com/research/data/
 *   2. Rentals → Data Type: "ZORI (Smoothed, Seasonally Adjusted):
 *      All Homes Plus Multifamily Time Series ($)"
 *   3. Geography: "ZIP Codes" → Download
 *   4. Move the CSV into data/ (rename to Zip_zori_sa.csv)
 *   5. Run: node scripts/update-zori-sa.js
 *      Or:  node scripts/update-zori-sa.js --csv path/to/file.csv
 *
 * Only updates median_rent (and recalculates gross_rental_yield,
 * rent_to_price_ratio, grm from the new rent). Everything else is untouched.
 */

const path = require('path');
const fs   = require('fs');

const backendModules = path.resolve(__dirname, '..', 'backend', 'node_modules');
if (fs.existsSync(backendModules)) module.paths.unshift(backendModules);

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
} catch (_) {}

const { Pool } = require('pg');
const { loadZillowZori } = require('../backend/src/services/freeDataSources');

// ── Args ──────────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const csvIdx = args.indexOf('--csv');
const csvPath = csvIdx >= 0
  ? args[csvIdx + 1]
  : path.resolve(__dirname, '../data/Zip_zori_sa.csv');

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    console.error('Download from zillow.com/research/data → ZORI SA → ZIP Codes → save to data/Zip_zori_sa.csv');
    process.exit(1);
  }

  console.log(`Loading SA ZORI from: ${csvPath}`);
  const rows = await loadZillowZori(csvPath);
  console.log(`  Parsed ${rows.length} zip rows`);

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const rent = row.value;
    if (!rent || rent <= 0) { skipped++; continue; }

    if (dryRun) {
      updated++;
      continue;
    }

    const result = await db.query(
      `UPDATE zip_data
         SET median_rent         = $1::integer,
             gross_rental_yield  = CASE WHEN median_price > 0
                                     THEN ROUND(($1::numeric * 12.0 / median_price * 100), 2)
                                     ELSE gross_rental_yield END,
             rent_to_price_ratio = CASE WHEN median_price > 0
                                     THEN ROUND(($1::numeric * 12.0 / median_price), 4)
                                     ELSE rent_to_price_ratio END,
             grm                 = CASE WHEN $1::numeric > 0 AND median_price > 0
                                     THEN ROUND((median_price / ($1::numeric * 12.0)), 2)
                                     ELSE grm END
       WHERE zip_code = $2`,
      [rent, row.zipCode]
    );
    if (result.rowCount > 0) updated++;
    else skipped++;
  }

  await db.end();

  console.log(`\nDone${dryRun ? ' (dry run)' : ''}:`);
  console.log(`  Updated: ${updated.toLocaleString()} zips`);
  console.log(`  Skipped: ${skipped.toLocaleString()} (not in DB or no rent value)`);
  if (dryRun) console.log('\nRe-run without --dry-run to apply changes.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
