/**
 * alerts.js — Admin-only route to manually trigger Pro user yield alerts.
 *
 * POST /api/alerts/trigger
 *   Headers: x-admin-token: <ADMIN_SECRET>
 *   Body: { threshold: 8 }  (optional — defaults to 8%)
 *
 * In production this is also called automatically by auto-refresh.js
 * after each monthly data update.
 *
 * NOTE: Emails won't deliver until a Resend verified domain is configured.
 * Until then, matches are logged and the endpoint still returns 200.
 */

'use strict';

const express        = require('express');
const router         = express.Router();
const { checkAndSendAlerts } = require('../services/alertService');

// Simple admin auth middleware — accepts same ADMIN_EMAILS env var
// OR a dedicated ADMIN_SECRET token in the request header
function adminOnly(req, res, next) {
  const secret = process.env.ADMIN_SECRET || process.env.JWT_SECRET;
  const token  = req.headers['x-admin-token'];
  if (!token || token !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/**
 * POST /api/alerts/trigger
 * Manually kick off the alert check for all Pro users.
 */
router.post('/trigger', adminOnly, async (req, res) => {
  const threshold = Number(req.body?.threshold) || 8;
  try {
    const result = await checkAndSendAlerts({ defaultThreshold: threshold });
    res.json({ success: true, threshold, ...result });
  } catch (err) {
    console.error('Alert trigger error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
