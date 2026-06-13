require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const sql = fs.readFileSync(
  path.join(__dirname, '../../database/migrations/016_user_alert_settings.sql'), 'utf8'
);

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(sql);
    console.log('✅ Migration 016 applied — alerts_enabled + alert_threshold added to users table');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
