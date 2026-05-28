/**
 * enrich-counties.js
 *
 * Enriches zip_data with county names AND lat/lng from the GeoNames
 * US postal code database (public domain, ~42k ZIPs).
 *
 * Run once (from project root):
 *   node backend/scripts/enrich-counties.js
 *
 * GeoNames US.txt columns (tab-delimited, no header):
 *  0  country_code
 *  1  postal_code  (zip)
 *  2  place_name   (city)
 *  3  admin_name1  (state name)
 *  4  admin_code1  (state abbreviation)
 *  5  admin_name2  (county/parish/borough name)
 *  6  admin_code2  (county FIPS)
 *  7–8 (unused)
 *  9  latitude
 *  10 longitude
 *  11 accuracy
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch {
  console.error('❌ Missing dependency. Run: npm install adm-zip --no-save');
  process.exit(1);
}

const https      = require('https');
const { Pool }   = require('pg');

const GEONAMES_URL = 'https://download.geonames.org/export/zip/US.zip';
const BATCH_SIZE   = 500;

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
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Returns a Map<zip, { county, lat, lng }> from GeoNames US.txt text.
 */
function buildZipDataMap(text) {
  const lines = text.split('\n');
  const map   = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 10) continue;

    const zip    = (cols[1]  || '').trim();
    const county = (cols[5]  || '').trim();
    const lat    = parseFloat(cols[9]  || '');
    const lng    = parseFloat(cols[10] || '');

    if (!zip) continue;
    if (!map.has(zip)) {
      map.set(zip, { county: county || null, lat: isNaN(lat) ? null : lat, lng: isNaN(lng) ? null : lng });
    }
  }

  // Also index without leading zeros (safety net)
  for (const [zip, data] of [...map]) {
    const stripped = String(parseInt(zip, 10));
    if (stripped !== zip) map.set(stripped, data);
  }

  return map;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🌍 County + lat/lng enrichment starting…');
    console.log(`   Source: ${GEONAMES_URL}\n`);

    // 1. Download GeoNames ZIP archive
    console.log('⬇️  Downloading GeoNames US zip code database…');
    const buffer = await fetchBinary(GEONAMES_URL);
    console.log(`   Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

    // 2. Extract US.txt from the archive
    const archive = new AdmZip(buffer);
    const entry   = archive.getEntry('US.txt');
    if (!entry) throw new Error('US.txt not found in downloaded archive');
    const text = entry.getData().toString('utf8');

    const geoMap = buildZipDataMap(text);
    console.log(`   ${geoMap.size.toLocaleString()} zip records loaded from GeoNames`);

    // Sanity check a few known zips
    ['10001', '77001', '90210', '60601', '85001'].forEach(z => {
      const d = geoMap.get(z);
      console.log(`   ${z} → county: ${d?.county || '?'}, lat: ${d?.lat}, lng: ${d?.lng}`);
    });

    // 3. Ensure lat/lng columns exist (idempotent)
    await pool.query(`
      ALTER TABLE zip_data ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6);
      ALTER TABLE zip_data ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);
    `);

    // 4. Fetch all zip codes from our DB
    const { rows: zips } = await pool.query(`SELECT zip_code FROM zip_data ORDER BY zip_code`);
    console.log(`\n📦 ${zips.length.toLocaleString()} zip codes in database`);

    let updatedCounty = 0;
    let updatedLatLng = 0;
    let skipped       = 0;

    for (let i = 0; i < zips.length; i += BATCH_SIZE) {
      const batch  = zips.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let   p      = 1;

      for (const { zip_code } of batch) {
        const geo = geoMap.get(zip_code) || geoMap.get(zip_code.padStart(5, '0'));
        if (!geo) { skipped++; continue; }

        if (geo.county) updatedCounty++;
        if (geo.lat)    updatedLatLng++;

        values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(zip_code, geo.county, geo.lat, geo.lng);
      }

      if (values.length === 0) continue;

      await pool.query(
        `UPDATE zip_data AS z
         SET
           county = COALESCE(z.county, v.county),
           lat    = COALESCE(z.lat,    v.lat::DECIMAL(9,6)),
           lng    = COALESCE(z.lng,    v.lng::DECIMAL(9,6))
         FROM (VALUES ${values.join(',')}) AS v(zip_code, county, lat, lng)
         WHERE z.zip_code = v.zip_code`,
        params
      );

      const pct = Math.round(((i + batch.length) / zips.length) * 100);
      process.stdout.write(`\r   Progress: ${pct}%  `);
    }

    console.log('\n');
    console.log('✅ Done!');
    console.log(`   Counties populated: ${updatedCounty.toLocaleString()}`);
    console.log(`   Lat/lng populated:  ${updatedLatLng.toLocaleString()}`);
    console.log(`   No GeoNames match:  ${skipped.toLocaleString()}`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
