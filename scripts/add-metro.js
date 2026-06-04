#!/usr/bin/env node
/**
 * Add metro column to zip_data and populate from zhvi.csv.
 * Run: node scripts/add-metro.js
 *      node scripts/add-metro.js --dry-run
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
const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // 1. Add column if it doesn't exist
  if (!dryRun) {
    await db.query(`ALTER TABLE zip_data ADD COLUMN IF NOT EXISTS metro VARCHAR(120)`);
    console.log('✓ metro column ready');
  }

  // 2. Parse metro values from zhvi.csv
  const csvPath = path.resolve(__dirname, '../backend/data/zhvi.csv');
  const lines   = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const header  = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const zipIdx  = header.findIndex(h => h === 'RegionName');
  const metroIdx = header.findIndex(h => h === 'Metro');

  if (zipIdx === -1 || metroIdx === -1) {
    console.error('Could not find RegionName or Metro column'); process.exit(1);
  }

  // Build zip→metro map, clean up values
  const zipToMetro = new Map();
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const row   = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const zip   = (row[zipIdx] || '').replace(/^"|"$/g, '').trim();
    const metro = (row[metroIdx] || '').replace(/^"|"$/g, '').trim();
    if (zip.length === 5 && metro) zipToMetro.set(zip, metro);
  }
  console.log(`Parsed ${zipToMetro.size} zip→metro mappings`);

  if (dryRun) {
    // Show a few examples
    [...zipToMetro.entries()].slice(0, 5).forEach(([z, m]) => console.log(' ', z, '→', m));
    console.log('\nDry run — no changes written.');
    await db.end(); return;
  }

  // 3. Batch update
  const zips   = [...zipToMetro.keys()];
  const metros = [...zipToMetro.values()];
  const res = await db.query(
    `UPDATE zip_data SET metro = v.metro
       FROM UNNEST($1::text[], $2::text[]) AS v(zip, metro)
       WHERE zip_data.zip_code = v.zip`,
    [zips, metros]
  );
  console.log(`Updated ${res.rowCount} zips with metro area`);

  await db.end();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
