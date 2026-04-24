/**
 * Ingest zip-level market data from Zillow ZHVI/ZORI CSVs into zip_data table.
 *
 * Usage:
 *   node backend/scripts/ingest-zip-data.js
 *
 * Required files in backend/data/:
 *   zhvi.csv   — Zillow Home Value Index (zip code geography, All Homes)
 *   zori.csv   — Zillow Observed Rent Index (zip code geography)
 *
 * Download both from: https://www.zillow.com/research/data/
 *   ZHVI: "Home Values" > "Zip Code" > All Homes (Time Series, Smoothed, Seasonally Adjusted)
 *   ZORI: "Rental" > "Zip Code" > All Homes Plus Multifamily
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const { Pool } = require('pg');
const { loadZillowZhvi, loadZillowZori } = require('../src/services/freeDataSources');

const ZHVI_PATH = path.join(__dirname, '../data/zhvi.csv');
const ZORI_PATH = path.join(__dirname, '../data/zori.csv');
const BATCH_SIZE = 100; // rows per INSERT statement

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('Loading ZHVI (home values)...');
    const zhviRows = await loadZillowZhvi(ZHVI_PATH);
    console.log(`  ${zhviRows.length} zip codes loaded from ZHVI`);

    console.log('Loading ZORI (rents)...');
    const zoriRows = await loadZillowZori(ZORI_PATH);
    console.log(`  ${zoriRows.length} zip codes loaded from ZORI`);

    // Build lookup maps
    const zhviByZip = new Map(zhviRows.map((r) => [r.zipCode, r]));
    const zoriByZip = new Map(zoriRows.map((r) => [r.zipCode, r]));

    // Merge: only include zips that have both price AND rent
    const allZips = new Set([...zhviByZip.keys(), ...zoriByZip.keys()]);
    const records = [];

    for (const zip of allZips) {
      const zhvi = zhviByZip.get(zip);
      const zori = zoriByZip.get(zip);

      const medianPrice = zhvi?.value ?? null;
      const medianRent = zori?.value ?? null;
      const state = zhvi?.state || zori?.state || null;

      if (!medianPrice || !medianRent || !state) continue;

      const rentToPriceRatio = medianRent / medianPrice;           // e.g. 0.0085
      const grossRentalYield = (medianRent * 12 / medianPrice) * 100; // e.g. 8.5
      const grm = medianPrice / (medianRent * 12);                  // e.g. 118

      records.push({ zip, state, medianPrice, medianRent, rentToPriceRatio, grossRentalYield, grm });
    }

    console.log(`\nMerged ${records.length} zip codes with both price and rent data`);

    // Upsert in batches — one multi-row INSERT per batch to minimize round trips
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      // Build parameterized multi-row VALUES clause
      const values = [];
      const params = [];
      batch.forEach((r, idx) => {
        const base = idx * 7;
        values.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},NOW())`);
        params.push(
          r.zip, r.state, r.medianPrice, r.medianRent,
          r.rentToPriceRatio.toFixed(6), r.grossRentalYield.toFixed(4), r.grm.toFixed(4)
        );
      });

      const sql = `
        INSERT INTO zip_data (zip_code, state, median_price, median_rent, rent_to_price_ratio, gross_rental_yield, grm, last_updated)
        VALUES ${values.join(',')}
        ON CONFLICT (zip_code, state) DO UPDATE SET
          median_price        = EXCLUDED.median_price,
          median_rent         = EXCLUDED.median_rent,
          rent_to_price_ratio = EXCLUDED.rent_to_price_ratio,
          gross_rental_yield  = EXCLUDED.gross_rental_yield,
          grm                 = EXCLUDED.grm,
          last_updated        = NOW()`;

      // Get a fresh connection per batch to avoid long-lived connection timeouts
      const client = await pool.connect();
      try {
        await client.query(sql, params);
        inserted += batch.length;
      } finally {
        client.release();
      }

      const pct = Math.round(((i + batch.length) / records.length) * 100);
      process.stdout.write(`\r  Progress: ${i + batch.length}/${records.length} (${pct}%)`);
    }

    console.log(`\n\nDone.`);
    console.log(`  Inserted: ${inserted} new zip codes`);
    console.log(`  Updated:  ${updated} existing zip codes`);
    console.log(`  Total:    ${inserted + updated}`);

    // Quick sanity check
    const check = await pool.query(`
      SELECT COUNT(*) AS total,
             AVG(gross_rental_yield) AS avg_yield,
             MIN(median_price) AS min_price,
             MAX(median_price) AS max_price
      FROM zip_data
    `);
    const s = check.rows[0];
    console.log(`\nDatabase summary:`);
    console.log(`  Total zip codes in DB: ${s.total}`);
    console.log(`  Avg gross yield:       ${parseFloat(s.avg_yield).toFixed(2)}%`);
    console.log(`  Price range:           $${Number(s.min_price).toLocaleString()} – $${Number(s.max_price).toLocaleString()}`);

  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('\nIngestion failed:', err.message);
  process.exit(1);
});
