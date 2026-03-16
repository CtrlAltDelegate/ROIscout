/**
 * Mapbox usage tracking and alerts.
 * - Track map loads in Redis (key: mapbox:loads:YYYY-MM) to estimate usage.
 * - Free tier: 50,000 map loads/month. Alert when approaching threshold.
 */

const cacheService = require('./cacheService');

const MAPBOX_LOAD_KEY_PREFIX = 'mapbox:loads:';
const FREE_TIER_LIMIT = 50000;
const ALERT_THRESHOLD = 40000; // Warn when exceeding this

function currentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${MAPBOX_LOAD_KEY_PREFIX}${y}-${m}`;
}

function secondsUntilEndOfMonth() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return Math.max(0, Math.floor((end - now) / 1000));
}

/**
 * Record one map load (call from frontend when map mounts or when tiles are requested via our proxy).
 */
async function recordMapLoad() {
  const key = currentMonthKey();
  const val = await cacheService.incr(key);
  if (val === 1) {
    await cacheService.expire(key, secondsUntilEndOfMonth());
  }
  if (val >= ALERT_THRESHOLD && val <= ALERT_THRESHOLD + 10) {
    console.warn(`[Mapbox] Usage alert: ${val} map loads this month (threshold ${ALERT_THRESHOLD}). Free tier limit: ${FREE_TIER_LIMIT}. Consider setting up Mapbox Dashboard alerts.`);
  }
  return val;
}

/**
 * Get current month's map load count and status.
 */
async function getMapUsage() {
  const key = currentMonthKey();
  const raw = await cacheService.getString(key);
  const count = raw ? parseInt(raw, 10) : 0;
  const isOverAlert = count >= ALERT_THRESHOLD;
  const isOverLimit = count >= FREE_TIER_LIMIT;
  return {
    month: key.replace(MAPBOX_LOAD_KEY_PREFIX, ''),
    mapLoads: count,
    freeTierLimit: FREE_TIER_LIMIT,
    alertThreshold: ALERT_THRESHOLD,
    nearLimit: isOverAlert,
    overLimit: isOverLimit,
  };
}

module.exports = {
  recordMapLoad,
  getMapUsage,
  FREE_TIER_LIMIT,
  ALERT_THRESHOLD,
};
