/**
 * enrich-market-indicators.js
 *
 * Maps Zillow metro-level market indicator CSVs to zip codes.
 *
 * Matching chain:
 *   Zillow RegionName (metro name) → normalize → match HUD FMR metro name
 *   → get CBSA code → look up zip via HUD ZIP-CBSA crosswalk
 *
 * Required files in backend/data/:
 *   inventory.csv            — For-Sale Inventory (Smooth, All Homes, Monthly)
 *   days_pending.csv         — Mean Days to Pending (Smooth, All Homes, Monthly)
 *   price_cuts.csv           — Share of Listings With a Price Cut (Smooth, Monthly)
 *   market_heat_index.csv    — Market Heat Index (All Homes, Monthly)
 *   renter_affordability.csv — New Renter Affordability (Metro & US)
 *   sale_to_list.csv         — Median Sale-to-List Ratio (Smooth, All Homes, Monthly)
 *   new_listings.csv         — New Listings (Smooth, All Homes, Monthly)
 *   median_list_price.csv    — Median List Price (Smooth, SFR Only, Monthly)
 *
 * Usage: node scripts/enrich-market-indicators.js
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const fs   = require('fs');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { parseCsvLine } = require('../src/services/freeDataSources');

const DATA_DIR   = path.join(__dirname, '../data');
const BATCH_SIZE = 200;

const METRO_FILES = [
  { file: 'inventory.csv',            dbCol: 'for_sale_inventory',  round: true  },
  { file: 'days_pending.csv',         dbCol: 'days_on_market',      round: true  },
  { file: 'price_cuts.csv',           dbCol: 'price_cut_pct',       round: false },
  { file: 'market_heat_index.csv',    dbCol: 'market_heat_index',   round: false },
  { file: 'renter_affordability.csv', dbCol: 'renter_affordability',round: false },
  { file: 'sale_to_list.csv',         dbCol: 'sale_to_list_ratio',  round: false },
  { file: 'new_listings.csv',         dbCol: 'new_listings_count',  round: true  },
  { file: 'median_list_price.csv',    dbCol: 'median_list_price',   round: true  },
];

// ── Name normalization (same logic as enrich-bedroom-rents.js) ────────────────

function normalizeName(name) {
  return String(name)
    .replace(/\s*(hud metro fmr area|metro fmr area|metropolitan statistical area|metropolitan area|metro area|msa)\s*/gi, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function metroKey(normalized) {
  const commaIdx = normalized.lastIndexOf(',');
  if (commaIdx === -1) return null;
  const primaryCity  = normalized.slice(0, commaIdx).trim().split('-')[0].trim();
  const primaryState = normalized.slice(commaIdx + 1).trim().split('-')[0].trim().slice(0, 2);
  return `${primaryCity}|${primaryState}`;
}

// ── Load HUD FMR → Map<metroKey, cbsaCode> ───────────────────────────────────

function loadHudMetroKeys() {
  const wb   = XLSX.readFile(path.join(DATA_DIR, 'hud_fmr.xlsx'));
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const hdr  = rows[0];
  const areaCodeIdx = hdr.indexOf('hud_area_code');
  const areaNameIdx = hdr.indexOf('hud_area_name');

  const keyToCbsa = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row      = rows[i];
    const areaCode = String(row[areaCodeIdx] || '');
    const cbsaMatch = areaCode.match(/METRO(\d+)M/);
    if (!cbsaMatch) continue;
    const cbsa = cbsaMatch[1];
    const key  = metroKey(normalizeName(String(row[areaNameIdx] || '')));
    if (key) keyToCbsa.set(key, cbsa);
  }
  return keyToCbsa;
}

// ── Load ZIP-CBSA → Map<zip5, cbsaCode> ──────────────────────────────────────

function loadZipCbsa() {
  const wb   = XLSX.readFile(path.join(DATA_DIR, 'hud_zip_cbsa.xlsx'));
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const hdr  = rows[0];
  const zipIdx  = hdr.indexOf('ZIP');
  const cbsaIdx = hdr.indexOf('CBSA');
  const resIdx  = hdr.indexOf('RES_RATIO');

  const best = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row  = rows[i];
    const zip  = String(row[zipIdx]  ?? '').padStart(5, '0');
    const cbsa = String(row[cbsaIdx] ?? '').trim();
    const res  = Number(row[resIdx]  ?? 0);
    if (zip.length !== 5 || !cbsa || cbsa === '99999') continue;
    const prev = best.get(zip);
    if (!prev || res > prev.res) best.set(zip, { cbsa, res });
  }
  const map = new Map();
  for (const [zip, { cbsa }] of best) map.set(zip, cbsa);
  return map;
}

// ── Parse Zillow metro CSV → Map<cbsaCode, latestValue> ─────────────────────
// Matches via metro name → HUD key → CBSA code

function parseMetroCsv(filePath, hudKeyToCbsa) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return new Map();

  const header       = parseCsvLine(lines[0]);
  const nameIdx      = header.findIndex(h => /RegionName/i.test(h));
  const regionTypeIdx= header.findIndex(h => /RegionType/i.test(h));

  const dateCols = header
    .map((h, i) => ({ h: h.trim(), i }))
    .filter(({ h }) => /^\d{4}-\d{2}-\d{2}$/.test(h))
    .sort((a, b) => a.h.localeCompare(b.h));

  if (!dateCols.length) return new Map();
  const lastCol = dateCols[dateCols.length - 1];

  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row  = parseCsvLine(lines[i]);
    const type = regionTypeIdx >= 0 ? String(row[regionTypeIdx] || '').toLowerCase() : '';
    if (type && type !== 'msa' && type !== 'metro' && type !== 'msa division') continue;

    const regionName = String(row[nameIdx] || '').trim();
    if (!regionName) continue;

    // Match via normalized metro name → CBSA
    const key  = metroKey(normalizeName(regionName));
    const cbsa = key ? hudKeyToCbsa.get(key) : null;
    if (!cbsa) continue;

    const raw = row[lastCol.i];
    if (!raw || raw === '') continue;
    const val = parseFloat(String(raw).replace(/[,%$]/g, ''));
    if (!Number.isNaN(val)) map.set(cbsa, val);
  }

  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Loading reference data...');
    const hudKeyToCbsa = loadHudMetroKeys();
    const zipToCbsa    = loadZipCbsa();
    console.log(`  HUD metro keys: ${hudKeyToCbsa.size}`);
    console.log(`  ZIP-CBSA: ${zipToCbsa.size} zips`);

    // Build zip → value maps for each metric via CBSA
    console.log('\nParsing metro CSVs...');
    const metricMaps = {};
    for (const { file, dbCol } of METRO_FILES) {
      const filePath = path.join(DATA_DIR, file);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        console.log(`  ⚠️  Skipping ${file} (not found or empty)`);
        continue;
      }
      const byCbsa = parseMetroCsv(filePath, hudKeyToCbsa);
      // Build zip → value map
      const byZip = new Map();
      for (const [zip, cbsa] of zipToCbsa) {
        const val = byCbsa.get(cbsa);
        if (val != null) byZip.set(zip, val);
      }
      metricMaps[dbCol] = byZip;
      console.log(`  ✓ ${file}: ${byCbsa.size} CBSA matches → ${byZip.size} zips`);
    }

    const availableCols = METRO_FILES.filter(m => metricMaps[m.dbCol]?.size > 0);
    if (!availableCols.length) {
      console.log('\n⚠️  No metrics matched any zips — check file formats');
      return;
    }

    // Upsert
    const { rows: zipRows } = await pool.query('SELECT zip_code FROM zip_data');
    console.log(`\nEnriching ${zipRows.length} zip codes with ${availableCols.length} metrics...`);

    let enriched = 0;
    for (let i = 0; i < zipRows.length; i += BATCH_SIZE) {
      const batch  = zipRows.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const { zip_code } of batch) {
          const zip  = String(zip_code).padStart(5, '0');
          const sets   = [];
          const params = [];
          let   idx    = 1;

          for (const { dbCol, round } of availableCols) {
            const val = metricMaps[dbCol]?.get(zip);
            if (val == null) continue;
            const stored = round ? Math.round(val) : parseFloat(val.toFixed(3));
            sets.push(`${dbCol} = COALESCE($${idx}, ${dbCol})`);
            params.push(stored);
            idx++;
          }

          if (!sets.length) continue;
          params.push(zip_code);
          await client.query(
            `UPDATE zip_data SET ${sets.join(', ')}, last_updated = NOW() WHERE zip_code = $${idx}`,
            params
          );
          enriched++;
        }
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, zipRows.length)}/${zipRows.length}`);
    }

    console.log(`\n\nDone — ${enriched} zips updated`);
    for (const { dbCol } of availableCols) {
      console.log(`  ${dbCol}: ${metricMaps[dbCol].size} zips with data`);
    }

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
