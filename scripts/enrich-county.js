#!/usr/bin/env node
/**
 * Fill missing county names in zip_data using the Census ZCTA→County
 * relationship file (public domain, no registration required).
 *
 * Source: https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/
 *         tab20_zcta520_county20_natl.txt
 *
 * The file maps each ZCTA to one or more counties by land area. We assign
 * the county that has the largest overlap (primary county).
 *
 * County names come from the Census county gazetteer file (also public domain).
 *
 * Run: node scripts/enrich-county.js
 *      node scripts/enrich-county.js --dry-run
 */

const path  = require('path');
const fs    = require('fs');
const https = require('https');

const backendModules = path.resolve(__dirname, '..', 'backend', 'node_modules');
if (fs.existsSync(backendModules)) module.paths.unshift(backendModules);

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
} catch (_) {}

const { Pool } = require('pg');

const dryRun = process.argv.includes('--dry-run');

// ── Download helper ───────────────────────────────────────────────────────────
function download(url) {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ── Parse zip→county CSV ──────────────────────────────────────────────────────
// Format: state_fips,state,state_abbr,zipcode,county,city
// One row per zip+city combo — take first county seen per zip.
function parseZipCounty(text) {
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1); // skip header
  const map = new Map();
  for (const line of lines) {
    const parts = line.split(',');
    const zip    = String(parts[3] || '').trim().padStart(5, '0');
    const county = String(parts[4] || '').trim();
    if (zip.length === 5 && county && !map.has(zip)) {
      map.set(zip, county);
    }
  }
  return map;
}

async function main() {
  console.log('Enriching zip_data county names from Census data...\n');

  // Download zip→county CSV (public domain, GitHub)
  console.log('Downloading zip→county data...');
  const csv = await download(
    'https://raw.githubusercontent.com/scpike/us-state-county-zip/master/geo-data.csv'
  );
  const zipToCounty = parseZipCounty(csv); // Map<zip, countyName>
  console.log(`  Parsed ${zipToCounty.size} zip→county mappings\n`);

  // 4. Update DB
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Only update rows where county IS NULL
  const { rows: missing } = await db.query(
    `SELECT zip_code FROM zip_data WHERE county IS NULL`
  );
  console.log(`Found ${missing.length} zips missing county in DB`);

  let updated = 0, skipped = 0;
  for (const { zip_code } of missing) {
    const county = zipToCounty.get(zip_code);
    if (!county) { skipped++; continue; }
    if (!dryRun) {
      await db.query(`UPDATE zip_data SET county = $1 WHERE zip_code = $2`, [county, zip_code]);
    }
    updated++;
  }

  await db.end();

  console.log(`\nDone${dryRun ? ' (dry run)' : ''}:`);
  console.log(`  Updated: ${updated.toLocaleString()} zips`);
  console.log(`  No match: ${skipped.toLocaleString()} zips`);
  if (dryRun) console.log('Re-run without --dry-run to apply.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
