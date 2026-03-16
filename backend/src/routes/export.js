const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const usageService = require('../services/usageService');
const { query } = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/export/csv - Export ROI data as CSV (Pro tier only)
 * Query params: state, county, zipCode, etc. (same as pricing-data)
 */
router.get('/csv', async (req, res) => {
  try {
    const userId = req.user.userId;
    const limits = await usageService.getUserPlanLimits(userId);
    if (limits.export_csv !== -1) {
      return res.status(403).json({
        error: 'Pro required',
        message: 'CSV export is available on the Pro plan. Upgrade to export your data.',
      });
    }

    const state = req.query.state;
    if (!state) {
      return res.status(400).json({ error: 'Missing required parameter: state' });
    }

    const conditions = ['state = $1'];
    const params = [state.toUpperCase()];
    let n = 1;
    if (req.query.county) { n++; conditions.push(`county = $${n}`); params.push(req.query.county); }
    if (req.query.zipCode) { n++; conditions.push(`zip_code = $${n}`); params.push(req.query.zipCode); }
    if (req.query.minPrice) { n++; conditions.push(`median_price >= $${n}`); params.push(parseInt(req.query.minPrice, 10)); }
    if (req.query.maxPrice) { n++; conditions.push(`median_price <= $${n}`); params.push(parseInt(req.query.maxPrice, 10)); }
    if (req.query.minRent) { n++; conditions.push(`median_rent >= $${n}`); params.push(parseInt(req.query.minRent, 10)); }
    conditions.push('median_price > 0');
    conditions.push('median_rent > 0');

    const result = await query(
      `SELECT zip_code, state, county, median_price, median_rent, rent_to_price_ratio, gross_rental_yield, grm
       FROM zip_data WHERE ${conditions.join(' AND ')}
       ORDER BY gross_rental_yield DESC NULLS LAST
       LIMIT 2000`,
      params
    );

    const rows = result.rows;
    const header = 'zip_code,state,county,median_price,median_rent,rent_to_price_ratio,gross_rental_yield,grm';
    const csv = [header, ...rows.map(r =>
      [r.zip_code, r.state, r.county || '', r.median_price ?? '', r.median_rent ?? '', r.rent_to_price_ratio ?? '', r.gross_rental_yield ?? '', r.grm ?? ''].join(',')
    )].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="roiscout-export.csv"');
    res.send(csv);

    await usageService.trackUsage(userId, 'export_csv', 1);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Export failed', message: err.message });
  }
});

module.exports = router;
