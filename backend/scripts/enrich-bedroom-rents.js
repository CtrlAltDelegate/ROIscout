/**
 * enrich-bedroom-rents.js
 *
 * Enriches zip_data with two new rent data sources:
 *
 *  1. rent_sfr — Zillow SFR ZORI (single-family rent) from metro-level CSV,
 *                mapped to zips via HUD ZIP-CBSA crosswalk + name matching.
 *
 *  2. hud_fmr_1br–4br — HUD Fair Market Rents by bedroom count, mapped to
 *                        zips via HUD ZIP-COUNTY crosswalk.
 *
 * Required files in backend/data/:
 *   zori_sfr_metro.csv  — Zillow SFR ZORI, Metro & U.S. geography
 *   hud_fmr.xlsx        — HUD FY2026 County Level FMR data
 *   hud_zip_cbsa.xlsx   — HUD ZIP-CBSA crosswalk
 *   hud_zip_county.xlsx — HUD ZIP-COUNTY crosswalk
 *
 * Usage:
 *   node scripts/enrich-bedroom-rents.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const fs   = require('fs');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { parseCsvLine } = require('../src/services/freeDataSources');

const DATA_DIR   = path.join(__dirname, '../data');
const BATCH_SIZE = 200;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Read an xlsx file and return rows as array-of-arrays (first row = headers). */
function readXlsx(filename) {
  const wb = XLSX.readFile(path.join(DATA_DIR, filename));
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

/**
 * Normalize a metro area name for matching:
 * Strip common suffixes, lowercase, collapse whitespace.
 * "Chicago-Naperville-Elgin, IL-IN-WI HUD Metro FMR Area" → "chicago-naperville-elgin, il-in-wi"
 */
function normalizeName(name) {
  return String(name)
    .replace(/\s*(hud metro fmr area|metro fmr area|metropolitan statistical area|metropolitan area|metro area|msa)\s*/gi, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract primary city + primary state from a normalized metro name.
 * "chicago-naperville-elgin, il-in-wi" → { city: "chicago", state: "il" }
 */
function metroKey(normalized) {
  const commaIdx = normalized.lastIndexOf(',');
  if (commaIdx === -1) return null;
  const cityPart  = normalized.slice(0, commaIdx).trim();
  const statePart = normalized.slice(commaIdx + 1).trim();
  const primaryCity  = cityPart.split('-')[0].trim();
  const primaryState = statePart.split('-')[0].trim().slice(0, 2);
  return `${primaryCity}|${primaryState}`;
}

// ── Load ZIP-CBSA crosswalk ───────────────────────────────────────────────────
// Returns Map<zip5, cbsaCode> — picks the CBSA with the highest RES_RATIO per zip.

function loadZipCbsa() {
  const rows = readXlsx('hud_zip_cbsa.xlsx');
  const header = rows[0]; // ZIP, CBSA, USPS_ZIP_PREF_CITY, USPS_ZIP_PREF_STATE, RES_RATIO, ...
  const zipIdx = header.indexOf('ZIP');
  const cbsaIdx = header.indexOf('CBSA');
  const resIdx = header.indexOf('RES_RATIO');

  const best = new Map(); // zip → { cbsa, res }
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const zip  = String(row[zipIdx] ?? '').padStart(5, '0');
    const cbsa = String(row[cbsaIdx] ?? '').trim();
    const res  = Number(row[resIdx] ?? 0);
    if (zip.length !== 5 || !cbsa || cbsa === '99999') continue;
    const prev = best.get(zip);
    if (!prev || res > prev.res) best.set(zip, { cbsa, res });
  }

  const map = new Map();
  for (const [zip, { cbsa }] of best) map.set(zip, cbsa);
  console.log(`  ZIP-CBSA crosswalk: ${map.size} zips mapped`);
  return map;
}

// ── Load ZIP-COUNTY crosswalk ─────────────────────────────────────────────────
// Returns Map<zip5, countyFips5> — picks the county with the highest RES_RATIO per zip.

function loadZipCounty() {
  const rows = readXlsx('hud_zip_county.xlsx');
  const header = rows[0]; // ZIP, COUNTY, ...RES_RATIO
  const zipIdx    = header.indexOf('ZIP');
  const countyIdx = header.indexOf('COUNTY');
  const resIdx    = header.indexOf('RES_RATIO');

  const best = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    const zip    = String(row[zipIdx]    ?? '').padStart(5, '0');
    const county = String(row[countyIdx] ?? '').padStart(5, '0');
    const res    = Number(row[resIdx]    ?? 0);
    if (zip.length !== 5 || county.length !== 5) continue;
    const prev = best.get(zip);
    if (!prev || res > prev.res) best.set(zip, { county, res });
  }

  const map = new Map();
  for (const [zip, { county }] of best) map.set(zip, county);
  console.log(`  ZIP-COUNTY crosswalk: ${map.size} zips mapped`);
  return map;
}

// ── Load HUD FMR data ─────────────────────────────────────────────────────────
// Returns:
//   fmrByCounty: Map<countyFips5, {fmr1, fmr2, fmr3, fmr4}>
//   cbsaToKey:   Map<cbsaCode,    metroKey string>  (for SFR ZORI matching)

function loadHudFmr() {
  const rows   = readXlsx('hud_fmr.xlsx');
  const header = rows[0];
  // stusps,state,hud_area_code,countyname,county_town_name,metro,hud_area_name,fips,pop2023,fmr_0,fmr_1,fmr_2,fmr_3,fmr_4
  const areaCodeIdx  = header.indexOf('hud_area_code');
  const areaNameIdx  = header.indexOf('hud_area_name');
  const fipsIdx      = header.indexOf('fips');
  const fmr1Idx      = header.indexOf('fmr_1');
  const fmr2Idx      = header.indexOf('fmr_2');
  const fmr3Idx      = header.indexOf('fmr_3');
  const fmr4Idx      = header.indexOf('fmr_4');

  const fmrByCounty = new Map();
  const cbsaToKey   = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fips5     = String(row[fipsIdx] ?? '').slice(0, 5).padStart(5, '0');
    const fmr1      = Number(row[fmr1Idx]);
    const fmr2      = Number(row[fmr2Idx]);
    const fmr3      = Number(row[fmr3Idx]);
    const fmr4      = Number(row[fmr4Idx]);
    if (!fips5 || !fmr2) continue;

    fmrByCounty.set(fips5, { fmr1, fmr2, fmr3, fmr4 });

    // Extract CBSA code from hud_area_code, e.g. "METRO33860M33860" → "33860"
    const areaCode = String(row[areaCodeIdx] ?? '');
    const cbsaMatch = areaCode.match(/METRO(\d+)M/);
    if (cbsaMatch) {
      const cbsa     = cbsaMatch[1];
      const areaName = String(row[areaNameIdx] ?? '');
      const key      = metroKey(normalizeName(areaName));
      if (key) cbsaToKey.set(cbsa, key);
    }
  }

  console.log(`  HUD FMR: ${fmrByCounty.size} counties loaded`);
  console.log(`  HUD FMR: ${cbsaToKey.size} CBSA→metro-key mappings built`);
  return { fmrByCounty, cbsaToKey };
}

// ── Load Zillow SFR ZORI ──────────────────────────────────────────────────────
// Returns Map<metroKey, sfrValue>

function loadSfrZori() {
  const csvPath = path.join(DATA_DIR, 'zori_sfr_metro.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines   = content.split(/\r?\n/).filter(Boolean);

  // Parse header using quoted-CSV parser so "New York, NY" doesn't split on the comma
  const header   = parseCsvLine(lines[0]);
  const nameIdx  = header.findIndex(h => /RegionName/i.test(h));
  const typeIdx  = header.findIndex(h => /RegionType/i.test(h));
  const dateCols = header.map((h, i) => ({ h, i })).filter(({ h }) => /^\d{4}-\d{2}-\d{2}$/.test(h.trim()));
  const lastCol  = dateCols[dateCols.length - 1]?.i ?? -1;

  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (String(cols[typeIdx] ?? '').trim().toLowerCase() === 'country') continue;
    const name  = String(cols[nameIdx] ?? '').trim();
    const value = Number(cols[lastCol]);
    if (!name || !value) continue;
    const key = metroKey(normalizeName(name));
    if (key) map.set(key, Math.round(value));
  }

  console.log(`  SFR ZORI: ${map.size} metro entries loaded`);
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('Loading crosswalk and reference data...');
    const zipToCbsa   = loadZipCbsa();
    const zipToCounty = loadZipCounty();
    const { fmrByCounty, cbsaToKey } = loadHudFmr();
    const sfrByKey    = loadSfrZori();

    // Build CBSA → SFR value map via metro-key matching
    const sfrByCbsa = new Map();
    let sfrMatched = 0;
    for (const [cbsa, key] of cbsaToKey) {
      const sfr = sfrByKey.get(key);
      if (sfr) { sfrByCbsa.set(cbsa, sfr); sfrMatched++; }
    }
    console.log(`  SFR ZORI matched to ${sfrMatched} CBSAs via metro name`);

    // Pull all zips from zip_data
    const { rows: zipRows } = await pool.query('SELECT zip_code FROM zip_data');
    console.log(`\nEnriching ${zipRows.length} zip codes...`);

    let enriched = 0;
    let sfrHits  = 0;
    let fmrHits  = 0;

    for (let i = 0; i < zipRows.length; i += BATCH_SIZE) {
      const batch  = zipRows.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const { zip_code } of batch) {
          const zip     = String(zip_code).padStart(5, '0');
          const cbsa    = zipToCbsa.get(zip);
          const county5 = zipToCounty.get(zip);

          const rentSfr = cbsa ? (sfrByCbsa.get(cbsa) ?? null) : null;
          const fmr     = county5 ? (fmrByCounty.get(county5) ?? null) : null;

          if (!rentSfr && !fmr) continue;
          if (rentSfr) sfrHits++;
          if (fmr) fmrHits++;

          await client.query(
            `UPDATE zip_data SET
               rent_sfr     = COALESCE($1, rent_sfr),
               hud_fmr_1br  = COALESCE($2, hud_fmr_1br),
               hud_fmr_2br  = COALESCE($3, hud_fmr_2br),
               hud_fmr_3br  = COALESCE($4, hud_fmr_3br),
               hud_fmr_4br  = COALESCE($5, hud_fmr_4br),
               last_updated = NOW()
             WHERE zip_code = $6`,
            [
              rentSfr,
              fmr?.fmr1 ?? null,
              fmr?.fmr2 ?? null,
              fmr?.fmr3 ?? null,
              fmr?.fmr4 ?? null,
              zip_code,
            ]
          );
          enriched++;
        }
      } finally {
        client.release();
      }

      const pct = Math.round(((i + batch.length) / zipRows.length) * 100);
      process.stdout.write(`\r  Progress: ${i + batch.length}/${zipRows.length} (${pct}%)`);
    }

    console.log(`\n\nDone.`);
    console.log(`  Zips updated:    ${enriched}`);
    console.log(`  With rent_sfr:   ${sfrHits}`);
    console.log(`  With HUD FMR:    ${fmrHits}`);

    // Sanity check
    const check = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE rent_sfr IS NOT NULL)    AS sfr_count,
        COUNT(*) FILTER (WHERE hud_fmr_2br IS NOT NULL) AS fmr_count,
        ROUND(AVG(hud_fmr_2br))                         AS avg_2br_fmr
      FROM zip_data
    `);
    const s = check.rows[0];
    console.log(`\nDatabase summary:`);
    console.log(`  Zips with SFR ZORI:   ${s.sfr_count}`);
    console.log(`  Zips with HUD FMR:    ${s.fmr_count}`);
    console.log(`  Avg 2BR FMR:          $${Number(s.avg_2br_fmr).toLocaleString()}`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nEnrichment failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
