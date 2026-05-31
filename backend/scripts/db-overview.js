require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const overview = await pool.query(`
    SELECT
      COUNT(*)                                          AS total_zips,
      COUNT(DISTINCT state)                             AS states,
      COUNT(*) FILTER (WHERE rent_sfr IS NOT NULL)      AS has_sfr_zori,
      COUNT(*) FILTER (WHERE hud_fmr_2br IS NOT NULL)   AS has_hud_fmr,
      COUNT(*) FILTER (WHERE rent_sfr IS NOT NULL AND hud_fmr_2br IS NOT NULL) AS has_both,
      COUNT(*) FILTER (WHERE rent_sfr IS NULL AND hud_fmr_2br IS NULL)         AS has_neither,
      ROUND(AVG(median_rent))                           AS avg_allhomes_rent,
      ROUND(AVG(rent_sfr))                              AS avg_sfr_rent,
      ROUND(AVG(hud_fmr_2br))                           AS avg_hud_2br,
      ROUND(AVG(gross_rental_yield), 2)                 AS avg_yield,
      MIN(median_price)                                 AS min_price,
      MAX(median_price)                                 AS max_price
    FROM zip_data
  `);
  console.log('\n=== OVERALL ===');
  console.table(overview.rows);

  const byState = await pool.query(`
    SELECT
      state,
      COUNT(*)                                         AS zips,
      COUNT(*) FILTER (WHERE rent_sfr IS NOT NULL)     AS sfr_zips,
      COUNT(*) FILTER (WHERE hud_fmr_2br IS NOT NULL)  AS fmr_zips,
      ROUND(AVG(median_rent))                          AS avg_rent,
      ROUND(AVG(rent_sfr))                             AS avg_sfr,
      ROUND(AVG(hud_fmr_2br))                          AS avg_fmr_2br,
      ROUND(AVG(gross_rental_yield), 2)                AS avg_yield
    FROM zip_data
    GROUP BY state
    ORDER BY state
  `);
  console.log('\n=== BY STATE ===');
  console.table(byState.rows);

  const ratios = await pool.query(`
    SELECT
      ROUND(AVG(hud_fmr_1br::numeric / hud_fmr_2br), 3) AS avg_1br_ratio,
      1.000                                               AS avg_2br_ratio,
      ROUND(AVG(hud_fmr_3br::numeric / hud_fmr_2br), 3) AS avg_3br_ratio,
      ROUND(AVG(hud_fmr_4br::numeric / hud_fmr_2br), 3) AS avg_4br_ratio,
      ROUND(MIN(hud_fmr_1br::numeric / hud_fmr_2br), 3) AS min_1br_ratio,
      ROUND(MAX(hud_fmr_1br::numeric / hud_fmr_2br), 3) AS max_1br_ratio,
      ROUND(MIN(hud_fmr_4br::numeric / hud_fmr_2br), 3) AS min_4br_ratio,
      ROUND(MAX(hud_fmr_4br::numeric / hud_fmr_2br), 3) AS max_4br_ratio
    FROM zip_data WHERE hud_fmr_2br IS NOT NULL
  `);
  console.log('\n=== HUD BEDROOM RATIOS (relative to 2BR) ===');
  console.table(ratios.rows);

  await pool.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
