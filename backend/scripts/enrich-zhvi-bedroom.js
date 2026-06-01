/**
 * enrich-zhvi-bedroom.js
 *
 * Ingests Zillow ZHVI by bedroom count (zip-level) into zip_data.
 * Gives us actual median home prices per bedroom tier per zip —
 * replacing the blended median_price for bedroom-specific cash flow analysis.
 *
 * Required files in backend/data/:
 *   zhvi_sfr.csv   — ZHVI Single-Family Homes (Zip Code)
 *   zhvi_1br.csv   — ZHVI 1-Bedroom (Zip Code)
 *   zhvi_2br.csv   — ZHVI 2-Bedroom (Zip Code)
 *   zhvi_3br.csv   — ZHVI 3-Bedroom (Zip Code)
 *   zhvi_4br.csv   — ZHVI 4-Bedroom (Zip Code)
 *   zhvi_5br.csv   — ZHVI 5+ Bedroom (Zip Code)
 *
 * Usage: node scripts/enrich-zhvi-bedroom.js
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const { Pool } = require('pg');
const { parseZillowCsv } = require('../src/services/freeDataSources');

const DATA_DIR   = path.join(__dirname, '../data');
const BATCH_SIZE = 200;

const BEDROOM_FILES = [
  { file: 'zhvi_sfr.csv',  dbCol: 'price_sfr', label: 'SFR'      },
  { file: 'zhvi_1br.csv',  dbCol: 'price_1br', label: '1-bedroom' },
  { file: 'zhvi_2br.csv',  dbCol: 'price_2br', label: '2-bedroom' },
  { file: 'zhvi_3br.csv',  dbCol: 'price_3br', label: '3-bedroom' },
  { file: 'zhvi_4br.csv',  dbCol: 'price_4br', label: '4-bedroom' },
  { file: 'zhvi_5br.csv',  dbCol: 'price_5br', label: '5-bedroom' },
];

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Load all bedroom ZHVI files into maps
    console.log('Loading bedroom ZHVI CSVs...');
    const maps = {};
    for (const { file, dbCol, label } of BEDROOM_FILES) {
      const filePath = path.join(DATA_DIR, file);
      const rows = await parseZillowCsv(filePath);
      maps[dbCol] = new Map(rows.map(r => [r.zipCode, r.value]));
      console.log(`  ✓ ${label}: ${maps[dbCol].size} zip codes`);
    }

    // All zips in DB
    const { rows: dbZips } = await pool.query('SELECT zip_code FROM zip_data');
    console.log(`\nUpserting bedroom prices for ${dbZips.length} zip codes...`);

    let enriched = 0;
    let hits = { price_sfr: 0, price_1br: 0, price_2br: 0, price_3br: 0, price_4br: 0, price_5br: 0 };

    for (let i = 0; i < dbZips.length; i += BATCH_SIZE) {
      const batch  = dbZips.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const { zip_code } of batch) {
          const zip = String(zip_code).padStart(5, '0');

          const sets   = [];
          const params = [];
          let   idx    = 1;

          for (const { dbCol } of BEDROOM_FILES) {
            const val = maps[dbCol].get(zip);
            if (!val) continue;
            sets.push(`${dbCol} = COALESCE($${idx}, ${dbCol})`);
            params.push(val);
            hits[dbCol] = (hits[dbCol] || 0) + 1;
            idx++;
          }

          if (!sets.length) continue;
          params.push(zip_code);
          await client.query(
            `UPDATE zip_data SET ${sets.join(', ')}, last_updated = NOW() WHERE zip_code = $${idx}`,
            params
          );
          enriched++;
        }
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, dbZips.length)}/${dbZips.length}`);
    }

    console.log(`\n\nDone — ${enriched} zips updated`);
    for (const { dbCol, label } of BEDROOM_FILES) {
      console.log(`  ${label}: ${hits[dbCol] || 0} zips`);
    }

    // Sample — show a few zips with full bedroom price ladder
    const sample = await pool.query(`
      SELECT zip_code, state, median_price, price_sfr,
             price_1br, price_2br, price_3br, price_4br, price_5br
      FROM zip_data
      WHERE price_1br IS NOT NULL AND price_4br IS NOT NULL
        AND state = 'IN'
      ORDER BY gross_rental_yield DESC NULLS LAST
      LIMIT 5
    `);
    if (sample.rows.length) {
      console.log('\nSample — Indiana top-yield zips with full price ladder:');
      console.table(sample.rows);
    }

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
