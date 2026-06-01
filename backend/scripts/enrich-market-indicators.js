/**
 * enrich-market-indicators.js
 *
 * Downloads Zillow metro-level market health CSVs and maps them to
 * zip codes via the HUD ZIP-CBSA crosswalk:
 *
 *   days_on_market     — median days to pending sale
 *   for_sale_inventory — active for-sale listing count
 *   price_cut_pct      — % of listings with a price reduction
 *
 * All three are metro (MSA) level from Zillow Research — free, no auth.
 *
 * Usage: node scripts/enrich-market-indicators.js
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { parseCsvLine } = require('../src/services/freeDataSources');
const fs = require('fs');

const DATA_DIR   = path.join(__dirname, '../data');
const BATCH_SIZE = 200;

// Expected local filenames in backend/data/
// Download from zillow.com/research/data → "For-Sale Listings" section:
//   days_pending.csv  → "Days to Pending" → Metro & U.S. → Download
//   inventory.csv     → "For-Sale Inventory" → Metro & U.S. → Download
//   price_cuts.csv    → "Price Cuts" → Metro & U.S. → Download
const LOCAL_FILES = {
  dom:       path.join(DATA_DIR, 'days_pending.csv'),
  inventory: path.join(DATA_DIR, 'inventory.csv'),
  priceCut:  path.join(DATA_DIR, 'price_cuts.csv'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readLocalCsv(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing file: ${path.basename(filePath)}\n` +
      `  Download from zillow.com/research/data → "${label}" → Metro & U.S. → Download\n` +
      `  Save as: ${filePath}`
    );
  }
  console.log(`  Reading: ${path.basename(filePath)}`);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Parse a Zillow metro CSV and return Map<cbsaCode, latestValue>.
 * Metro CSVs have a RegionID column that IS the CBSA code.
 */
function parseMetroCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return new Map();

  const header = parseCsvLine(lines[0]);
  const regionIdIdx   = header.findIndex(h => /RegionID/i.test(h));
  const regionTypeIdx = header.findIndex(h => /RegionType/i.test(h));

  // Latest date column
  const dateCols = header
    .map((h, i) => ({ h: h.trim(), i }))
    .filter(({ h }) => /^\d{4}-\d{2}-\d{2}$/.test(h))
    .sort((a, b) => a.h.localeCompare(b.h));
  const lastCol = dateCols[dateCols.length - 1];
  if (!lastCol) return new Map();

  console.log(`    Latest date: ${lastCol.h}`);

  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row  = parseCsvLine(lines[i]);
    const type = regionTypeIdx >= 0 ? String(row[regionTypeIdx] || '').toLowerCase() : '';
    if (type && type !== 'msa' && type !== 'metro') continue;

    const cbsa = String(row[regionIdIdx] || '').trim();
    if (!cbsa) continue;

    const raw = row[lastCol.i];
    if (!raw || raw === '') continue;
    const val = parseFloat(String(raw).replace(/[,%]/g, ''));
    if (Number.isNaN(val)) continue;

    map.set(cbsa, val);
  }
  return map;
}

/** Load ZIP-CBSA crosswalk → Map<zip5, cbsaCode> */
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Loading ZIP-CBSA crosswalk...');
    const zipToCbsa = loadZipCbsa();
    console.log(`  ${zipToCbsa.size} zips mapped to CBSAs`);

    console.log('\nReading Zillow metro CSVs from local files...');
    const domContent = readLocalCsv(LOCAL_FILES.dom,       'Days to Pending');
    const invContent = readLocalCsv(LOCAL_FILES.inventory, 'For-Sale Inventory');
    const cutContent = readLocalCsv(LOCAL_FILES.priceCut,  'Price Cuts');

    console.log('\nParsing CSVs...');
    const domByCbsa = parseMetroCsv(domContent);
    const invByCbsa = parseMetroCsv(invContent);
    const cutByCbsa = parseMetroCsv(cutContent);

    console.log(`  Days on market:  ${domByCbsa.size} metros`);
    console.log(`  For-sale inv:    ${invByCbsa.size} metros`);
    console.log(`  Price cut pct:   ${cutByCbsa.size} metros`);

    // Pull all zips from DB
    const { rows: zipRows } = await pool.query('SELECT zip_code FROM zip_data');
    console.log(`\nEnriching ${zipRows.length} zip codes...`);

    let enriched = 0;
    let domHits  = 0;

    for (let i = 0; i < zipRows.length; i += BATCH_SIZE) {
      const batch  = zipRows.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const { zip_code } of batch) {
          const zip  = String(zip_code).padStart(5, '0');
          const cbsa = zipToCbsa.get(zip);
          if (!cbsa) continue;

          const dom = domByCbsa.get(cbsa) ?? null;
          const inv = invByCbsa.get(cbsa) ?? null;
          const cut = cutByCbsa.get(cbsa) ?? null;

          if (!dom && !inv && !cut) continue;
          if (dom) domHits++;

          await client.query(
            `UPDATE zip_data SET
               days_on_market     = COALESCE($1, days_on_market),
               for_sale_inventory = COALESCE($2, for_sale_inventory),
               price_cut_pct      = COALESCE($3, price_cut_pct),
               last_updated       = NOW()
             WHERE zip_code = $4`,
            [dom ? Math.round(dom) : null, inv ? Math.round(inv) : null, cut ? parseFloat(cut.toFixed(1)) : null, zip_code]
          );
          enriched++;
        }
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, zipRows.length)}/${zipRows.length}`);
    }

    const check = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE days_on_market IS NOT NULL)     AS dom_count,
        COUNT(*) FILTER (WHERE for_sale_inventory IS NOT NULL) AS inv_count,
        COUNT(*) FILTER (WHERE price_cut_pct IS NOT NULL)      AS cut_count,
        ROUND(AVG(days_on_market))    AS avg_dom,
        ROUND(AVG(price_cut_pct), 1)  AS avg_cut_pct
      FROM zip_data
    `);
    const s = check.rows[0];
    console.log(`\n\nDone — ${enriched} zips updated`);
    console.log(`  With days on market:   ${s.dom_count}`);
    console.log(`  With inventory:        ${s.inv_count}`);
    console.log(`  With price cut %:      ${s.cut_count}`);
    console.log(`  Avg days on market:    ${s.avg_dom}`);
    console.log(`  Avg price cut %:       ${s.avg_cut_pct}%`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
