/**
 * alertService.js — Pro user yield-change email alerts.
 *
 * Called automatically by auto-refresh.js after each monthly data update,
 * and available via POST /api/alerts/trigger (admin only, for manual testing).
 *
 * NOTE: Requires a verified Resend sending domain before emails will deliver.
 * Until then, matches are logged but emails are skipped gracefully.
 */

'use strict';

const { query } = require('../config/database');
const emailService = require('./emailService');

/**
 * Check each Pro user's saved searches for markets that newly exceed their
 * yield threshold (default 8%). Send a digest email for each user that
 * has at least one match.
 *
 * @param {object} opts
 * @param {number} opts.defaultThreshold  Yield % that qualifies as "high yield" (default 8)
 */
async function checkAndSendAlerts({ defaultThreshold = 8 } = {}) {
  console.log('🔔 Alert check starting…');

  // 1. Get all Pro users with saved searches who have alerts enabled
  const { rows: proUsers } = await query(`
    SELECT DISTINCT u.id, u.email,
      COALESCE(u.alerts_enabled,  TRUE)  AS alerts_enabled,
      COALESCE(u.alert_threshold, 8.0)   AS alert_threshold
    FROM users u
    JOIN saved_searches ss ON ss.user_id = u.id
    WHERE u.subscription_plan = 'pro'
      AND u.email IS NOT NULL
      AND COALESCE(u.alerts_enabled, TRUE) = TRUE
  `);

  if (proUsers.length === 0) {
    console.log('   No Pro users with saved searches — nothing to alert.');
    return { usersAlerted: 0, totalMatches: 0 };
  }

  console.log(`   ${proUsers.length} Pro user(s) to check`);

  let usersAlerted = 0;
  let totalMatches = 0;

  for (const user of proUsers) {
    // 2. Get their saved searches
    const { rows: searches } = await query(
      `SELECT id, search_name, filters FROM saved_searches WHERE user_id = $1`,
      [user.id]
    );

    const matchingSections = [];

    // Use per-user threshold, falling back to the run-level default
    const threshold = parseFloat(user.alert_threshold) || defaultThreshold;

    for (const search of searches) {
      let filters;
      try {
        filters = typeof search.filters === 'string'
          ? JSON.parse(search.filters)
          : search.filters;
      } catch {
        continue;
      }

      if (!filters?.state) continue;

      // 3. Find top markets for this search that exceed the user's threshold
      const conditions = ['state = $1', `gross_rental_yield >= ${threshold}`, 'median_price > 0', 'median_rent > 0'];
      const params = [filters.state.toUpperCase()];
      let p = 1;

      if (filters.county)   { p++; conditions.push(`county = $${p}`);       params.push(filters.county); }
      if (filters.minPrice) { p++; conditions.push(`median_price >= $${p}`); params.push(parseInt(filters.minPrice)); }
      if (filters.maxPrice) { p++; conditions.push(`median_price <= $${p}`); params.push(parseInt(filters.maxPrice)); }
      if (filters.minRent)  { p++; conditions.push(`median_rent >= $${p}`);  params.push(parseInt(filters.minRent)); }

      const { rows: markets } = await query(
        `SELECT zip_code, county, state, median_price, median_rent, gross_rental_yield
         FROM zip_data
         WHERE ${conditions.join(' AND ')}
         ORDER BY gross_rental_yield DESC NULLS LAST
         LIMIT 10`,
        params
      );

      if (markets.length > 0) {
        matchingSections.push({ search, markets });
        totalMatches += markets.length;
      }
    }

    if (matchingSections.length === 0) continue;

    // 4. Send digest email
    try {
      await sendAlertEmail(user.email, matchingSections, threshold);
      usersAlerted++;
      console.log(`   ✉️  Alert sent to ${user.email} (${matchingSections.length} search(es))`);
    } catch (err) {
      console.warn(`   ⚠️  Failed to send alert to ${user.email}: ${err.message}`);
    }
  }

  console.log(`✅ Alert run complete — ${usersAlerted} user(s) alerted, ${totalMatches} top markets found`);
  return { usersAlerted, totalMatches };
}

/**
 * Build and send the alert digest email.
 */
async function sendAlertEmail(toEmail, sections, threshold) {
  const subject = `ROIScout: ${sections.reduce((n, s) => n + s.markets.length, 0)} high-yield markets in your saved searches`;

  const body = sections.map(({ search, markets }) => {
    const rows = markets.map(m =>
      `  • ${m.zip_code} (${m.county || m.state}) — ${Number(m.gross_rental_yield).toFixed(1)}% yield · $${Number(m.median_price).toLocaleString()} · $${Number(m.median_rent).toLocaleString()}/mo`
    ).join('\n');
    return `Search: "${search.search_name}"\n${rows}`;
  }).join('\n\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="font-size:20px;font-weight:700">
          <span style="color:#4ade80">ROI</span><span style="color:#fff">Scout</span>
        </span>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
        <h2 style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 8px">
          High-yield markets in your saved searches
        </h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px">
          These zip codes in your saved searches currently exceed ${threshold}% gross rental yield.
        </p>
        ${sections.map(({ search, markets }) => `
          <div style="margin-bottom:24px">
            <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 10px">
              ${search.search_name}
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0">Zip</th>
                  <th style="text-align:left;padding:8px 12px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0">County</th>
                  <th style="text-align:right;padding:8px 12px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0">Yield</th>
                  <th style="text-align:right;padding:8px 12px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0">Price</th>
                  <th style="text-align:right;padding:8px 12px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0">Rent/mo</th>
                </tr>
              </thead>
              <tbody>
                ${markets.map((m, i) => `
                  <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                    <td style="padding:8px 12px;font-weight:600">${m.zip_code}</td>
                    <td style="padding:8px 12px;color:#64748b">${m.county || m.state}</td>
                    <td style="padding:8px 12px;text-align:right;font-weight:700;color:#16a34a">${Number(m.gross_rental_yield).toFixed(1)}%</td>
                    <td style="padding:8px 12px;text-align:right">$${Number(m.median_price).toLocaleString()}</td>
                    <td style="padding:8px 12px;text-align:right">$${Number(m.median_rent).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0">
          <a href="${process.env.FRONTEND_URL || 'https://roiscout.netlify.app'}/dashboard?tab=list"
             style="background:#16a34a;color:#fff;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
            Open ROIScout →
          </a>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px">
          You're receiving this because you're a Pro subscriber with saved searches.
          Manage alerts in your account settings.
        </p>
      </div>
    </div>
  `;

  await emailService.sendEmail({ to: toEmail, subject, html, text: body });
}

module.exports = { checkAndSendAlerts };
