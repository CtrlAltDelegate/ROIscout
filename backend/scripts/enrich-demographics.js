/**
 * enrich-demographics.js
 *
 * Fetches Census ACS 5-year estimates per zip code tabulation area (ZCTA):
 *   median_household_income  — B19013_001E
 *   population               — B01003_001E
 *   rent_to_income_ratio     — derived: (median_rent / (income / 12))
 *
 * Free, no API key required (though key reduces rate limiting).
 * Set CENSUS_API_KEY in .env if available.
 *
 * Usage: node scripts/enrich-demographics.js
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios  = require('axios');
const { Pool } = require('pg');

const BATCH_SIZE = 200;
const ACS_YEAR   = '2023';
const CENSUS_KEY = process.env.CENSUS_API_KEY || '';
const keyParam   = CENSUS_KEY ? `&key=${CENSUS_KEY}` : '';

// ZCTAs don't have a state parent in Census geography — must fetch all nationally
async function fetchAllZctaAcs() {
  const url = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5` +
    `?get=B19013_001E,B01003_001E` +
    `&for=zip%20code%20tabulation%20area:*${keyParam}`;

  console.log(`  Fetching: ${url.replace(keyParam, keyParam ? '&key=***' : '')}`);
  const res  = await axios.get(url, { timeout: 120000 });
  const rows = res.data;
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const header = rows[0];
  const incIdx = header.indexOf('B19013_001E');
  const popIdx = header.indexOf('B01003_001E');
  const ztaIdx = header.indexOf('zip code tabulation area');

  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const zip = String(row[ztaIdx] || '').trim();
    if (zip.length !== 5) continue;
    const income = parseInt(row[incIdx], 10);
    const pop    = parseInt(row[popIdx], 10);
    results.push({
      zip,
      income: income > 0 ? income : null,
      pop:    pop    > 0 ? pop    : null,
    });
  }
  return results;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(`Fetching Census ACS ${ACS_YEAR} data — nationwide ZCTA request...`);
    console.log(CENSUS_KEY ? '  Using API key' : '  No API key (add CENSUS_API_KEY to .env to avoid rate limits)');

    const rows = await fetchAllZctaAcs();

    const allRecords = new Map();
    rows.forEach(r => allRecords.set(r.zip, { income: r.income, pop: r.pop }));
    console.log(`  Fetched ${allRecords.size} ZCTAs with income/population data`);

    // Pull zips + current median_rent from DB for ratio calculation
    const { rows: dbZips } = await pool.query('SELECT zip_code, median_rent FROM zip_data');
    console.log(`Upserting demographics for ${dbZips.length} zip codes...`);

    let enriched = 0;
    let incHits  = 0;

    for (let i = 0; i < dbZips.length; i += BATCH_SIZE) {
      const batch  = dbZips.slice(i, i + BATCH_SIZE);
      const client = await pool.connect();
      try {
        for (const { zip_code, median_rent } of batch) {
          const zip  = String(zip_code).padStart(5, '0');
          const data = allRecords.get(zip);
          if (!data) continue;

          const { income, pop } = data;

          // rent-to-income: what % of gross monthly income goes to rent
          let rentToIncome = null;
          if (income && median_rent && income > 0) {
            rentToIncome = parseFloat(((median_rent / (income / 12)) * 100).toFixed(1));
          }

          if (income) incHits++;

          await client.query(
            `UPDATE zip_data SET
               median_household_income = COALESCE($1, median_household_income),
               population              = COALESCE($2, population),
               rent_to_income_ratio    = COALESCE($3, rent_to_income_ratio),
               last_updated            = NOW()
             WHERE zip_code = $4`,
            [income, pop, rentToIncome, zip_code]
          );
          enriched++;
        }
      } finally {
        client.release();
      }
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, dbZips.length)}/${dbZips.length}`);
    }

    const check = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE median_household_income IS NOT NULL) AS income_count,
        COUNT(*) FILTER (WHERE population IS NOT NULL)              AS pop_count,
        COUNT(*) FILTER (WHERE rent_to_income_ratio IS NOT NULL)    AS rti_count,
        ROUND(AVG(median_household_income))  AS avg_income,
        ROUND(AVG(population))               AS avg_pop,
        ROUND(AVG(rent_to_income_ratio), 1)  AS avg_rti
      FROM zip_data
    `);
    const s = check.rows[0];
    console.log(`\n\nDone — ${enriched} zips updated`);
    console.log(`  With household income:     ${s.income_count}`);
    console.log(`  With population:           ${s.pop_count}`);
    console.log(`  With rent-to-income ratio: ${s.rti_count}`);
    console.log(`  Avg household income:      $${Number(s.avg_income).toLocaleString()}`);
    console.log(`  Avg population per zip:    ${Number(s.avg_pop).toLocaleString()}`);
    console.log(`  Avg rent-to-income ratio:  ${s.avg_rti}%`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
