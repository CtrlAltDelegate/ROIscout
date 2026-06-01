require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const KEY = process.env.CENSUS_API_KEY || '';
const keyParam = KEY ? `&key=${KEY}` : '';

async function run() {
  // Test 1: nationwide ZCTA
  const url1 = `https://api.census.gov/data/2023/acs/acs5?get=B19013_001E,B01003_001E&for=zip%20code%20tabulation%20area:*${keyParam}`;
  console.log('Testing nationwide ZCTA request...');
  try {
    const r = await axios.get(url1, { timeout: 30000 });
    console.log('Status:', r.status);
    console.log('Type:', typeof r.data);
    console.log('Is array:', Array.isArray(r.data));
    if (Array.isArray(r.data)) {
      console.log('Row count:', r.data.length);
      console.log('Header:', r.data[0]);
      console.log('Row 1:', r.data[1]);
    } else {
      console.log('Data:', JSON.stringify(r.data).slice(0, 500));
    }
  } catch(e) {
    console.log('Error:', e.message);
    if (e.response) console.log('Response:', JSON.stringify(e.response.data).slice(0, 500));
  }

  // Test 2: single state ZCTA (Indiana)
  const url2 = `https://api.census.gov/data/2023/acs/acs5?get=B19013_001E,B01003_001E&for=zip%20code%20tabulation%20area:*&in=state:18${keyParam}`;
  console.log('\nTesting single-state (Indiana) ZCTA request...');
  try {
    const r = await axios.get(url2, { timeout: 30000 });
    console.log('Status:', r.status);
    console.log('Row count:', Array.isArray(r.data) ? r.data.length : 'not array');
    if (Array.isArray(r.data) && r.data.length > 1) {
      console.log('Header:', r.data[0]);
      console.log('Row 1:', r.data[1]);
    } else {
      console.log('Data:', JSON.stringify(r.data).slice(0, 500));
    }
  } catch(e) {
    console.log('Error:', e.message);
    if (e.response) console.log('Response:', JSON.stringify(e.response.data).slice(0, 500));
  }
}
run();
