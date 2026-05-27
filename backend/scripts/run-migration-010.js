/**
 * One-off script: create the password_reset_tokens table (migration 010).
 * Run from the backend/ directory:
 *   node scripts/run-migration-010.js
 */
require('dotenv').config();
const { pool } = require('../src/config/database');

const SQL = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(64) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON password_reset_tokens (user_id);
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running migration 010: password_reset_tokens...');
    await client.query(SQL);
    console.log('✅ Done — password_reset_tokens table is ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
