/**
 * enrich-growth-rates.js
 *
 * Computes rent and price growth rates from existing local Zillow CSVs:
 *   rent_growth_1yr  — ZORI % change vs 12 months ago
 *   rent_growth_3yr  — ZORI % change vs 36 months ago
 *   price_growth_1yr — ZHVI % change vs 12 months ago
 *   price_growth_5yr — ZHVI % change vs 60 months ago
 *
 * Uses local files (no download needed):
 *   backend/data/zori.csv
 *   backend/data/zhvi.csv
 *
 * Usage: node scripts/enrich-growth-rates.js
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const { Pool } = require('pg');
const { parseZillowCsvMultiDate } = require('../src/services/freeDataSources');

const ZORI_PATH = path.join(__dirname, '../data/zori.csv');
const ZHVI_PATH = path.join(__dirname, '../data/zhvi.csv');
const BATCH_SIZE = 200;

function growthPct(current, prior) {
  if (!current || !prior || prior === 0) return null;
  return parseFloat(((current - prior) / prior * 100).toFixed(2));
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Loading ZORI with historical dates...');
    const zoriRows = await parseZillowCsvMultiDate(ZORI_PATH);
    console.log(`  ${zoriRows.length} zip codes loaded`);

    console.log('Loading ZHVI with historical dates...');
    const zhviRows = await parseZillowCsvMultiDate(ZHVI_PATH);
    console.log(`  ${zhviRows.length} zip codes loaded`);

    // Build lookup maps
    const zoriByZip = new Map(zoriRows.map(r => [r.zipCode, r]));
    const zhviByZip = new Map(zhviRows.map(r => [r.zipCode, r]));

    // Merge into update records
    const allZips = new Set([...zoriByZip.keys(), ...zhviByZip.keys()]);
    const updates = [];

    for (const zip of allZips) {
      const zori = zoriByZip.get(zip);
      const zhvi = zhviByZip.get(zip);

      updates.push({
        zip,
        rent_growth_1yr:  zori ? growthPct(zori.latest, zori.ago12m) : null,
        rent_growth_3yr:  zori ? growthPct(zori.latest, zori.ago36m) : null,
        price_growth_1yr: zhvi ? growthPct(zhvi.latest, zhvi.ago12m) : null,
        price_growth_5yr: zhvi ? growthPct(zhvi.latest, zhvi.ago60m) : null,
      });
    }

    console.log(`\nUpserting growth rates for ${updates.length} zip codes...`);
    let done = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch  = updates.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const u of batch) {
          await client.query(
            `UPDATE zip_data SET
               rent_growth_1yr  = COALESCE($1, rent_growth_1yr),
               rent_growth_3yr  = COALESCE($2, rent_growth_3yr),
               price_growth_1yr = COALESCE($3, price_growth_1yr),
               price_growth_5yr = COALESCE($4, price_growth_5yr),
               last_updated     = NOW()
             WHERE zip_code = $5`,
            [u.rent_growth_1yr, u.rent_growth_3yr, u.price_growth_1yr, u.price_growth_5yr, u.zip]
          );
          done++;
        }
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
    }

    // Sanity check
    const check = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE rent_growth_1yr IS NOT NULL)  AS rent_1yr,
        COUNT(*) FILTER (WHERE price_growth_1yr IS NOT NULL) AS price_1yr,
        COUNT(*) FILTER (WHERE price_growth_5yr IS NOT NULL) AS price_5yr,
        ROUND(AVG(rent_growth_1yr), 2)  AS avg_rent_growth_1yr,
        ROUND(AVG(price_growth_1yr), 2) AS avg_price_growth_1yr,
        ROUND(AVG(price_growth_5yr), 2) AS avg_price_growth_5yr
      FROM zip_data
    `);
    const s = check.rows[0];
    console.log(`\n\nDone — ${done} zips updated`);
    console.log(`  Zips with rent growth 1yr:   ${s.rent_1yr}`);
    console.log(`  Zips with price growth 1yr:  ${s.price_1yr}`);
    console.log(`  Zips with price growth 5yr:  ${s.price_5yr}`);
    console.log(`  Avg rent growth YoY:         ${s.avg_rent_growth_1yr}%`);
    console.log(`  Avg price growth YoY:        ${s.avg_price_growth_1yr}%`);
    console.log(`  Avg price growth 5yr:        ${s.avg_price_growth_5yr}%`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
