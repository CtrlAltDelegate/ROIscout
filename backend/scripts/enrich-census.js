/**
 * enrich-census.js
 *
 * Fills remaining NULL county + lat/lng gaps using two Census Bureau files:
 *   - ZCTA-to-County relationship file (pipe-delimited text, direct download)
 *   - ZCTA5 Population Centers 2020 (CSV, direct download)
 *
 * Both files cover all ~33,000 US ZCTAs, not just named postal places.
 *
 * Run once (from project root):
 *   node backend/scripts/enrich-census.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const https    = require('https');
const http     = require('http');
const { Pool } = require('pg');

let AdmZip;
try { AdmZip = require('adm-zip'); } catch {
  console.error('❌ Run: cd backend && npm install adm-zip --no-save'); process.exit(1);
}

const COUNTY_URL    = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt';
// Gazetteer ZIP contains 2020_Gaz_zcta_national.txt with GEOID, INTPTLAT, INTPTLONG columns
const GAZETTEER_URL = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip';

const BATCH_SIZE = 500;

// ── helpers ───────────────────────────────────────────────────────────────────

function fetchText(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    let body = '';
    mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      res.setEncoding('utf8');
      res.on('data', c => { body += c; });
      res.on('end', () => resolve(body));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse ZCTA-to-county pipe file.
 * Strategy: for each ZCTA, pick the county with the largest land-area overlap.
 * Returns Map<zcta5, countyName>
 */
function parseCountyFile(text) {
  const lines   = text.split('\n');
  // Strip UTF-8 BOM if present
  const rawHdr  = lines[0].replace(/^﻿/, '');
  const headers = rawHdr.split('|').map(h => h.trim());
  // Census uses different column names across releases — handle both
  const iZip  = headers.findIndex(h => /ZCTA5CE20|GEOID_ZCTA5_20/i.test(h));
  const iName = headers.findIndex(h => /NAMELSAD_CNT_20|NAMELSAD_COUNTY_20/i.test(h));
  const iArea = headers.findIndex(h => /AREALAND_PART/i.test(h));

  if (iZip === -1) throw new Error(`ZCTA zip column not found. Headers: ${lines[0]}`);

  const best = new Map(); // zip → { name, area }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols   = line.split('|');
    const zip    = (cols[iZip]  || '').trim().padStart(5, '0');
    const county = (cols[iName] || '').trim();
    const area   = iArea >= 0 ? parseInt(cols[iArea] || '0', 10) || 0 : 0;
    if (!zip || !county) continue;

    const prev = best.get(zip);
    if (!prev || area > prev.area) best.set(zip, { name: county, area });
  }

  // Return simple name map
  const result = new Map();
  for (const [zip, { name }] of best) result.set(zip, name);
  return result;
}

/**
 * Fetch binary data (for ZIP files).
 */
function fetchBinary(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const chunks = [];
    mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBinary(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse Census ZCTA5 Gazetteer file (tab-delimited).
 * Columns: GEOID (ZCTA), ALAND, AWATER, ALAND_SQMI, AWATER_SQMI, INTPTLAT, INTPTLONG
 * Returns Map<zcta5, { lat, lng }>
 */
function parseGazetteerText(text) {
  const lines  = text.split('\n');
  // Strip BOM, find header
  const header = lines[0].replace(/^﻿/, '').split('\t').map(h => h.trim());
  const iZip   = header.findIndex(h => /^GEOID$/i.test(h));
  const iLat   = header.findIndex(h => /INTPTLAT|LATITUDE/i.test(h));
  const iLng   = header.findIndex(h => /INTPTLONG|LONGITUDE/i.test(h));

  if (iZip === -1 || iLat === -1 || iLng === -1) {
    console.log('  Gazetteer headers:', header);
    throw new Error('Could not find GEOID/INTPTLAT/INTPTLONG in Gazetteer');
  }

  const result = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t');
    const zip  = (cols[iZip] || '').trim().padStart(5, '0');
    const lat  = parseFloat(cols[iLat]);
    const lng  = parseFloat(cols[iLng]);
    if (!zip || isNaN(lat) || isNaN(lng)) continue;
    result.set(zip, { lat, lng });
  }
  return result;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('📍 Census ZCTA enrichment starting…\n');

    // 1. Download county relationship file
    console.log('⬇️  Downloading Census ZCTA-to-county file…');
    const countyText = await fetchText(COUNTY_URL);
    console.log(`   ${(countyText.length / 1024 / 1024).toFixed(1)} MB received`);
    const countyMap = parseCountyFile(countyText);
    console.log(`   ${countyMap.size.toLocaleString()} ZCTA→county mappings`);

    // 2. Download ZCTA5 Gazetteer (ZIP archive) for lat/lng centroids
    console.log('⬇️  Downloading Census ZCTA5 Gazetteer (lat/lng)…');
    let centroidMap = new Map();
    try {
      const zipBuf = await fetchBinary(GAZETTEER_URL);
      console.log(`   Downloaded ${(zipBuf.length / 1024 / 1024).toFixed(1)} MB`);
      const archive = new AdmZip(zipBuf);
      const entries = archive.getEntries().filter(e => e.entryName.endsWith('.txt'));
      if (entries.length === 0) throw new Error('No .txt file found in Gazetteer ZIP');
      const geoText = entries[0].getData().toString('utf8');
      centroidMap = parseGazetteerText(geoText);
      console.log(`   ${centroidMap.size.toLocaleString()} ZCTA→centroid mappings`);
    } catch (err) {
      console.warn(`   ⚠️  Gazetteer download failed (${err.message}) — skipping lat/lng for this run`);
    }

    // Sanity check
    ['10001', '77001', '90210', '60601', '85001'].forEach(z => {
      const c = countyMap.get(z);
      const p = centroidMap.get(z);
      console.log(`   ${z}: county=${c || '?'}, lat=${p?.lat?.toFixed(4) || '?'}, lng=${p?.lng?.toFixed(4) || '?'}`);
    });

    // 3. Fetch all zip codes from DB
    const { rows: zips } = await pool.query(
      `SELECT zip_code FROM zip_data ORDER BY zip_code`
    );
    console.log(`\n📦 Processing ${zips.length.toLocaleString()} zip codes…`);

    let updatedCounty = 0;
    let updatedLatLng = 0;
    let skipped       = 0;

    for (let i = 0; i < zips.length; i += BATCH_SIZE) {
      const batch  = zips.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let   p      = 1;

      for (const { zip_code } of batch) {
        const zip     = zip_code.padStart(5, '0');
        const county  = countyMap.get(zip) || null;
        const centroid = centroidMap.get(zip) || null;

        if (!county && !centroid) { skipped++; continue; }

        if (county)   updatedCounty++;
        if (centroid) updatedLatLng++;

        values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
          zip_code,
          county,
          centroid?.lat ?? null,
          centroid?.lng ?? null
        );
      }

      if (values.length === 0) continue;

      await pool.query(
        `UPDATE zip_data AS z
         SET
           county = COALESCE(z.county,       v.county),
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
    console.log(`   Counties populated this run:   ${updatedCounty.toLocaleString()}`);
    console.log(`   Lat/lng populated this run:    ${updatedLatLng.toLocaleString()}`);
    console.log(`   Zip codes with no Census match: ${skipped.toLocaleString()}`);

    // Final coverage
    const { rows: [cov] } = await pool.query(`
      SELECT
        COUNT(*) total,
        COUNT(county) county_filled,
        COUNT(lat) lat_filled
      FROM zip_data
    `);
    console.log(`\n   DB coverage after enrichment:`);
    console.log(`     Counties: ${cov.county_filled}/${cov.total} (${(cov.county_filled/cov.total*100).toFixed(1)}%)`);
    console.log(`     Lat/lng:  ${cov.lat_filled}/${cov.total} (${(cov.lat_filled/cov.total*100).toFixed(1)}%)`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
