'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

/** GET /api/user/settings — return current alert preferences */
router.get('/settings', async (req, res) => {
  try {
    const result = await query(
      'SELECT alerts_enabled, alert_threshold FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    const { alerts_enabled, alert_threshold } = result.rows[0];
    res.json({
      alerts_enabled:  alerts_enabled  ?? true,
      alert_threshold: parseFloat(alert_threshold ?? 8.0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/user/settings — update alert preferences */
router.put('/settings', async (req, res) => {
  try {
    const { alerts_enabled, alert_threshold } = req.body;

    const updates = [];
    const values  = [];
    let   p       = 1;

    if (alerts_enabled !== undefined) {
      updates.push(`alerts_enabled = $${p++}`);
      values.push(!!alerts_enabled);
    }
    if (alert_threshold !== undefined) {
      const t = parseFloat(alert_threshold);
      if (isNaN(t) || t < 0 || t > 30) {
        return res.status(400).json({ error: 'alert_threshold must be between 0 and 30' });
      }
      updates.push(`alert_threshold = $${p++}`);
      values.push(t);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.user.userId);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${p}`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
