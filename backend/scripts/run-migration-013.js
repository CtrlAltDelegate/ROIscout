/**
 * Run from backend/ directory:
 *   node scripts/run-migration-013.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const sql = fs.readFileSync(
  path.join(__dirname, '../../database/migrations/013_bedroom_rent_columns.sql'),
  'utf8'
);

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await pool.query(sql);
    console.log('✅ Migration 013 applied — rent_sfr + hud_fmr_1br–4br columns added');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
