/**
 * Mapbox usage tracking and optional tile proxy with Redis caching.
 * - POST /api/map/loaded - record a map load (call from frontend when map mounts)
 * - GET  /api/map/usage - current month usage and alert status (for admin/monitoring)
 * - GET  /api/map/tiles/:z/:x/:y - optional tile proxy with Redis cache (reduces Mapbox requests)
 */

const express = require('express');
const axios = require('axios');
const cacheService = require('../services/cacheService');
const mapboxUsageService = require('../services/mapboxUsageService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const TILE_CACHE_PREFIX = 'mapbox:tile:';
const TILE_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days
const MAPBOX_STYLE = process.env.MAPBOX_STYLE || 'mapbox/streets-v11';
const MAPBOX_TILE_SIZE = 256;

// Optional: record map load (no auth required so dashboard map view can call it)
router.post('/loaded', async (req, res) => {
  try {
    const count = await mapboxUsageService.recordMapLoad();
    res.json({ ok: true, mapLoadsThisMonth: count });
  } catch (e) {
    console.error('Map load record error:', e);
    res.status(500).json({ ok: false, error: 'Failed to record' });
  }
});

// Usage for monitoring (protected)
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const usage = await mapboxUsageService.getMapUsage();
    res.json(usage);
  } catch (e) {
    console.error('Map usage error:', e);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// Tile proxy with Redis cache (reduces redundant Mapbox tile requests)
router.get('/tiles/:z/:x/:y', async (req, res) => {
  const { z, x, y } = req.params;
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN;
  if (!token) {
    return res.status(503).send('Mapbox token not configured');
  }
  const cacheKey = `${TILE_CACHE_PREFIX}${z}:${x}:${y}`;

  try {
    const cached = await cacheService.getString(cacheKey);
    if (cached) {
      const buf = Buffer.from(cached, 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
      return res.send(buf);
    }
  } catch (e) {
    // continue to fetch from Mapbox
  }

  const url = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/${MAPBOX_TILE_SIZE}/${z}/${x}/${y}@2x?access_token=${token}`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(response.data);
    await cacheService.setString(cacheKey, buffer.toString('base64'), TILE_CACHE_TTL);
    const contentType = (response.headers['content-type'] || 'image/png').split(';')[0];
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(buffer);
  } catch (e) {
    console.error('Tile fetch error:', e.message);
    res.status(e.response?.status || 502).send(e.response?.data || 'Tile unavailable');
  }
});

module.exports = router;
