/**
 * Fix incorrect state assignments in zip_data table.
 *
 * The original ingestion trusted Zillow CSV state columns, which can be wrong
 * (metro-area mismatches cause CA/TX cross-contamination, etc.).
 * This script re-assigns state based on zip code prefix, which is authoritative.
 *
 * Usage:
 *   node backend/scripts/fix-zip-states.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const { getStateFromZip } = require('../src/services/freeDataSources');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Loading all zip codes from DB...');
    const { rows } = await pool.query('SELECT zip_code, state FROM zip_data');
    console.log(`  ${rows.length} rows loaded`);

    const fixes = [];
    for (const row of rows) {
      const correct = getStateFromZip(row.zip_code);
      if (correct && correct !== row.state) {
        fixes.push({ zip: row.zip_code, oldState: row.state, newState: correct });
      }
    }

    if (fixes.length === 0) {
      console.log('\nAll state assignments are correct — nothing to fix.');
      return;
    }

    console.log(`\n${fixes.length} rows need state correction. Sample:`);
    fixes.slice(0, 10).forEach(f =>
      console.log(`  ZIP ${f.zip}: ${f.oldState} → ${f.newState}`)
    );

    // Batch UPDATE using unnest
    console.log('\nApplying fixes...');
    const BATCH = 500;
    let updated = 0;
    for (let i = 0; i < fixes.length; i += BATCH) {
      const batch = fixes.slice(i, i + BATCH);
      const zips = batch.map(f => f.zip);
      const states = batch.map(f => f.newState);
      const client = await pool.connect();
      try {
        await client.query(`
          UPDATE zip_data z
          SET state = v.state
          FROM (SELECT unnest($1::text[]) AS zip_code, unnest($2::text[]) AS state) v
          WHERE z.zip_code = v.zip_code AND z.state != v.state
        `, [zips, states]);
        updated += batch.length;
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, fixes.length)}/${fixes.length}`);
    }

    console.log(`\n\nDone. Fixed ${updated} rows.`);

    // Summary check
    const check = await pool.query(`
      SELECT state, COUNT(*) as count
      FROM zip_data
      GROUP BY state
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('\nTop states after fix:');
    check.rows.forEach(r => console.log(`  ${r.state}: ${r.count}`));

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFix failed:', err.message);
  process.exit(1);
});
