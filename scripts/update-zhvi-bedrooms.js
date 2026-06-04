#!/usr/bin/env node
/**
 * Populate bedroom-specific ZHVI price columns in zip_data.
 *
 * Reads the Zillow ZHVI CSVs by bedroom count and updates:
 *   price_1br, price_2br, price_3br, price_4br, price_5br, price_sfr
 *
 * Expected CSVs in backend/data/ (already downloaded):
 *   zhvi_1br.csv, zhvi_2br.csv, zhvi_3br.csv, zhvi_4br.csv, zhvi_5br.csv, zhvi_sfr.csv
 *
 * Run from repo root:
 *   node scripts/update-zhvi-bedrooms.js
 *   node scripts/update-zhvi-bedrooms.js --dry-run
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
const { loadZillowZhvi } = require('../backend/src/services/freeDataSources');

const dryRun = process.argv.includes('--dry-run');

const DATA_DIR = path.resolve(__dirname, '../backend/data');

const BEDROOM_FILES = [
  { col: 'median_price', file: 'zhvi.csv'     },
  { col: 'price_1br',   file: 'zhvi_1br.csv'  },
  { col: 'price_2br',   file: 'zhvi_2br.csv'  },
  { col: 'price_3br',   file: 'zhvi_3br.csv'  },
  { col: 'price_4br',   file: 'zhvi_4br.csv'  },
  { col: 'price_5br',   file: 'zhvi_5br.csv'  },
  { col: 'price_sfr',   file: 'zhvi_sfr.csv'  },
];

// To resume a partial run, set this to the first column that didn't complete:
const RESUME_FROM = process.env.RESUME_FROM || '';

async function updateColumn(db, col, rows) {
  const valid = rows.filter(r => r.value && r.value > 0);
  const skipped = rows.length - valid.length;

  if (dryRun) return { updated: valid.length, skipped };

  // Batch update using UNNEST — single query regardless of row count
  const zips   = valid.map(r => r.zipCode);
  const prices = valid.map(r => r.value);

  const res = await db.query(
    `UPDATE zip_data
       SET ${col} = v.price::integer
       FROM UNNEST($1::text[], $2::integer[]) AS v(zip, price)
       WHERE zip_data.zip_code = v.zip`,
    [zips, prices]
  );

  return { updated: res.rowCount, skipped: skipped + (valid.length - res.rowCount) };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  let totalUpdated = 0;

  const filesToRun = RESUME_FROM
    ? BEDROOM_FILES.slice(BEDROOM_FILES.findIndex(f => f.col === RESUME_FROM))
    : BEDROOM_FILES;

  for (const { col, file } of filesToRun) {
    const csvPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(csvPath)) {
      console.log(`  SKIP ${col} — file not found: ${file}`);
      continue;
    }

    console.log(`Loading ${file}...`);
    const rows = await loadZillowZhvi(csvPath);
    console.log(`  Parsed ${rows.length} rows`);

    const { updated, skipped } = await updateColumn(db, col, rows);
    console.log(`  ${col}: ${updated} updated, ${skipped} skipped`);
    totalUpdated += updated;
  }

  await db.end();
  console.log(`\nDone${dryRun ? ' (dry run)' : ''}. Total rows written: ${totalUpdated.toLocaleString()}`);
  if (dryRun) console.log('Re-run without --dry-run to apply.');
}

main()
  .then(() => {
    if (!dryRun) triggerAlerts();
  })
  .catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });

async function triggerAlerts() {
  try {
    const { checkAndSendAlerts } = require('../backend/src/services/alertService');
    console.log('\nRunning yield-change alerts for Pro users...');
    const result = await checkAndSendAlerts({ defaultThreshold: 8 });
    console.log(`  Alerts sent: ${result.usersAlerted} users, ${result.totalMatches} matches`);
  } catch (err) {
    console.warn('  Alert trigger skipped:', err.message);
  }
}
