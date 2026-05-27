/**
 * auto-refresh.js — Download fresh Zillow CSVs and re-ingest into zip_data.
 *
 * Run manually:   node backend/scripts/auto-refresh.js
 * Railway cron:   set start command to "node scripts/auto-refresh.js"
 *                 with cron schedule "0 6 1 * *" (6 AM UTC, 1st of month)
 *
 * No local CSV files needed — streams directly from Zillow's public research URLs.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const { loadZillowZhvi, loadZillowZori } = require('../src/services/freeDataSources');

// Zillow public research download URLs (no auth required)
const ZHVI_URL = 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const ZORI_URL = 'https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv';

const BATCH_SIZE = 100;

async function main() {
  const startedAt = new Date();
  console.log(`\n🔄 ROI Scout data refresh — ${startedAt.toISOString()}`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });

  try {
    // ── Download ──────────────────────────────────────────────────────────────
    console.log('\n📥 Downloading ZHVI (home values)…');
    const zhviRows = await loadZillowZhvi(ZHVI_URL);
    console.log(`   ${zhviRows.length} zip codes loaded`);

    console.log('📥 Downloading ZORI (rents)…');
    const zoriRows = await loadZillowZori(ZORI_URL);
    console.log(`   ${zoriRows.length} zip codes loaded`);

    // ── Merge ─────────────────────────────────────────────────────────────────
    const zhviByZip = new Map(zhviRows.map((r) => [r.zipCode, r]));
    const zoriByZip = new Map(zoriRows.map((r) => [r.zipCode, r]));
    const allZips   = new Set([...zhviByZip.keys(), ...zoriByZip.keys()]);

    const records = [];
    for (const zip of allZips) {
      const zhvi = zhviByZip.get(zip);
      const zori = zoriByZip.get(zip);

      const medianPrice = zhvi?.value ?? null;
      const medianRent  = zori?.value ?? null;
      const state       = zhvi?.state || zori?.state || null;

      if (!medianPrice || !medianRent || !state) continue;

      records.push({
        zip, state, medianPrice, medianRent,
        rentToPriceRatio:  medianRent / medianPrice,
        grossRentalYield: (medianRent * 12 / medianPrice) * 100,
        grm:               medianPrice / (medianRent * 12),
      });
    }
    console.log(`\n✅ ${records.length} zip codes have both price + rent data`);

    // ── Upsert ────────────────────────────────────────────────────────────────
    console.log('💾 Upserting into zip_data…');
    let processed = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch  = records.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];

      batch.forEach((r, idx) => {
        const b = idx * 7;
        values.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},NOW())`);
        params.push(
          r.zip, r.state, r.medianPrice, r.medianRent,
          r.rentToPriceRatio.toFixed(6),
          r.grossRentalYield.toFixed(4),
          r.grm.toFixed(4)
        );
      });

      const sql = `
        INSERT INTO zip_data
          (zip_code, state, median_price, median_rent,
           rent_to_price_ratio, gross_rental_yield, grm, last_updated)
        VALUES ${values.join(',')}
        ON CONFLICT (zip_code, state) DO UPDATE SET
          median_price        = EXCLUDED.median_price,
          median_rent         = EXCLUDED.median_rent,
          rent_to_price_ratio = EXCLUDED.rent_to_price_ratio,
          gross_rental_yield  = EXCLUDED.gross_rental_yield,
          grm                 = EXCLUDED.grm,
          last_updated        = NOW()`;

      const client = await pool.connect();
      try {
        await client.query(sql, params);
      } finally {
        client.release();
      }

      processed += batch.length;
      process.stdout.write(`\r   Progress: ${processed}/${records.length} (${Math.round(processed/records.length*100)}%)`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const check = await pool.query(`
      SELECT COUNT(*) AS total,
             ROUND(AVG(gross_rental_yield)::numeric, 2) AS avg_yield,
             MAX(last_updated) AS last_updated
      FROM zip_data
      WHERE median_price > 0 AND median_rent > 0
    `);
    const s = check.rows[0];
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    console.log(`\n\n🎉 Refresh complete in ${elapsed}s`);
    console.log(`   Total zip codes: ${s.total}`);
    console.log(`   Avg gross yield: ${s.avg_yield}%`);
    console.log(`   Data timestamp:  ${s.last_updated}`);

  } catch (err) {
    console.error('\n❌ Refresh failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
