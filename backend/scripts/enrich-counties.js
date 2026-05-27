/**
 * Enrich zip_data rows with county names from the GeoNames US postal code database.
 * Covers 42,000+ ZIP codes including county/parish/borough names.
 *
 * Run from the backend/ directory:
 *   npm install adm-zip --no-save   ← one-time install
 *   node scripts/enrich-counties.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch {
  console.error('❌ Missing dependency. Run this first:');
  console.error('   npm install adm-zip --no-save');
  process.exit(1);
}

const https = require('https');
const { Pool } = require('pg');

// GeoNames US postal code database (public domain, ~42k ZIPs with county)
// Columns (tab-delimited): country, zip, city, state, stateAbbr, county, countyFips, ...
const GEONAMES_URL = 'https://download.geonames.org/export/zip/US.zip';
const BATCH_SIZE = 500;

// ── helpers ───────────────────────────────────────────────────────────────────

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * GeoNames US.txt columns (tab-delimited, no header row):
 *  0  country_code   (US)
 *  1  postal_code    (zip)
 *  2  place_name     (city)
 *  3  admin_name1    (state name)
 *  4  admin_code1    (state abbreviation)
 *  5  admin_name2    (county/parish/borough name)
 *  6  admin_code2    (county FIPS)
 *  7  admin_name3
 *  8  admin_code3
 *  9  latitude
 * 10  longitude
 * 11  accuracy
 */
function buildZipCountyMap(text) {
  const lines = text.split('\n');
  const best = new Map(); // zip → county name

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 6) continue;

    const zip    = cols[1]?.trim();
    const county = cols[5]?.trim();

    if (!zip || !county) continue;

    // No duplicates to worry about — each ZIP appears once in GeoNames
    if (!best.has(zip)) best.set(zip, county);
  }

  // Also store without leading zeros (for DBs that strip them)
  for (const [zip, county] of [...best]) {
    const stripped = String(parseInt(zip, 10));
    if (stripped !== zip) best.set(stripped, county);
  }

  return best;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('Downloading GeoNames US zip code database...');
    const zipBuffer = await fetchBinary(GEONAMES_URL);
    console.log(`  Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

    // Extract US.txt from the ZIP archive
    const zip = new AdmZip(zipBuffer);
    const entry = zip.getEntry('US.txt');
    if (!entry) throw new Error('US.txt not found in downloaded archive');
    const text = entry.getData().toString('utf8');

    const zipCountyMap = buildZipCountyMap(text);
    console.log(`  ${zipCountyMap.size} zip→county mappings loaded`);

    // Sanity check
    ['92593', '74101', '10001', '90210', '77001'].forEach(z => {
      console.log(`  ${z} → ${zipCountyMap.get(z) || 'NOT FOUND'}`);
    });

    // Fetch rows that still need enrichment
    const { rows: zips } = await pool.query(
      `SELECT zip_code FROM zip_data WHERE county IS NULL OR county = ''`
    );
    console.log(`\n${zips.length} rows need county enrichment`);

    if (zips.length === 0) {
      console.log('Nothing to do — all rows already have county set.');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < zips.length; i += BATCH_SIZE) {
      const batch = zips.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let p = 1;

      for (const { zip_code } of batch) {
        const county = zipCountyMap.get(zip_code) ||
                       zipCountyMap.get(zip_code.padStart(5, '0'));
        if (!county) { skipped++; continue; }
        values.push(`($${p++}, $${p++})`);
        params.push(zip_code, county);
      }

      if (values.length === 0) continue;

      await pool.query(
        `UPDATE zip_data AS z
         SET county = v.county
         FROM (VALUES ${values.join(',')}) AS v(zip_code, county)
         WHERE z.zip_code = v.zip_code`,
        params
      );

      updated += values.length;
      process.stdout.write(`\r  Updated ${updated} / ${zips.length} rows...`);
    }

    console.log(`\n✅ Done — ${updated} rows updated, ${skipped} zips not in GeoNames.`);
  } catch (err) {
    console.error('\n❌ Enrichment failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
