require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {

  // State average fallback rents (from enrich-missing-states) - these are not real county rents
  // Excluding counties where ALL zips share the exact same rent (state avg artifact)
  const res = await pool.query(`
    WITH county_stats AS (
      SELECT
        state,
        county,
        COUNT(*)                              AS zips,
        ROUND(AVG(gross_rental_yield), 2)     AS avg_yield,
        ROUND(AVG(median_price))              AS avg_price,
        ROUND(AVG(median_rent))               AS avg_rent,
        COUNT(DISTINCT median_rent)           AS distinct_rents,
        ROUND(MIN(median_price))              AS min_price,
        ROUND(MAX(median_price))              AS max_price
      FROM zip_data
      WHERE county IS NOT NULL
        AND gross_rental_yield IS NOT NULL
        AND median_price > 50000
      GROUP BY state, county
    )
    SELECT *
    FROM county_stats
    WHERE zips >= 5              -- at least 5 zip codes (real market size)
      AND distinct_rents > 1     -- exclude state-avg fallback counties (all same rent)
      AND avg_price BETWEEN 60000 AND 800000  -- realistic investment range
    ORDER BY avg_yield DESC
    LIMIT 50
  `);

  console.log('\n=== TOP 50 COUNTIES — Real Data, Real Markets ===');
  console.table(res.rows);

  // Also show the distribution of states
  const states = {};
  res.rows.forEach(r => { states[r.state] = (states[r.state] || 0) + 1; });
  console.log('\nState distribution:', states);

  await pool.end();
}
run().catch(e => console.error(e.message));
