/**
 * Load test: filter + map combination (most common user flow).
 * Run: node scripts/load-test-filter-map.js [API_BASE]
 * Example: node scripts/load-test-filter-map.js http://localhost:5000
 *
 * Exercises:
 * - GET /api/data/pricing-data?state=TX (filter)
 * - POST /api/map/loaded (map load)
 * - GET /api/map/tiles/:z/:x/:y (tile proxy; verifies Redis cache via X-Cache: HIT/MISS)
 *
 * Uses Node 18+ native fetch (no extra dependencies).
 */

const API_BASE = process.argv[2] || process.env.API_BASE || 'http://localhost:5000';

const concurrentUsers = 10;
const iterationsPerUser = 5;
const tilePath = '/api/map/tiles/10/512/512';

async function get(url, options = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), options.timeout || 15000);
  const res = await fetch(url, { signal: ctrl.signal, ...options });
  clearTimeout(to);
  return res;
}

async function post(url, options = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), options.timeout || 5000);
  const res = await fetch(url, { method: 'POST', signal: ctrl.signal, ...options });
  clearTimeout(to);
  return res;
}

async function run() {
  console.log('Load test: filter + map flow');
  console.log('API_BASE:', API_BASE);
  console.log('Concurrent users:', concurrentUsers, '| Iterations per user:', iterationsPerUser);
  console.log('---');

  const timings = { pricing: [], mapLoaded: [], tile: [] };
  let tileHits = 0;
  let tileMisses = 0;

  async function oneUser(userId) {
    for (let i = 0; i < iterationsPerUser; i++) {
      try {
        const t0 = Date.now();
        await get(`${API_BASE}/api/data/pricing-data?state=TX`, { timeout: 15000 });
        timings.pricing.push(Date.now() - t0);
      } catch (e) {
        console.error(`User ${userId} pricing iter ${i}:`, e.message);
      }

      try {
        const t0 = Date.now();
        await post(`${API_BASE}/api/map/loaded`, { timeout: 5000 });
        timings.mapLoaded.push(Date.now() - t0);
      } catch (e) {
        console.error(`User ${userId} map/loaded iter ${i}:`, e.message);
      }

      try {
        const t0 = Date.now();
        const res = await get(`${API_BASE}${tilePath}`, { timeout: 10000 });
        await res.arrayBuffer(); // consume body
        timings.tile.push(Date.now() - t0);
        const cacheHeader = res.headers.get('x-cache') || '';
        if (cacheHeader.toLowerCase() === 'hit') tileHits++;
        else tileMisses++;
        if (res.status === 503) console.warn('Tile 503 (Mapbox token not set?)');
      } catch (e) {
        console.error(`User ${userId} tile iter ${i}:`, e.message);
      }
    }
  }

  const start = Date.now();
  await Promise.all(Array.from({ length: concurrentUsers }, (_, i) => oneUser(i)));
  const totalMs = Date.now() - start;

  function stats(arr) {
    if (!arr.length) return { count: 0, avg: 0, p50: 0, p95: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      count: sorted.length,
      avg: Math.round(sum / sorted.length),
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    };
  }

  console.log('\nResults:');
  console.log('  pricing-data:', JSON.stringify(stats(timings.pricing)));
  console.log('  map/loaded: ', JSON.stringify(stats(timings.mapLoaded)));
  console.log('  tiles:      ', JSON.stringify(stats(timings.tile)));
  const totalTile = tileHits + tileMisses;
  if (totalTile > 0) {
    console.log('  tile cache: ', `${tileHits}/${totalTile} HIT (${Math.round((tileHits / totalTile) * 100)}% hit rate)`);
  }
  console.log('  total time: ', `${totalMs}ms`);
  console.log('\nDone.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
