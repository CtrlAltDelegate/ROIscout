const axios = require('axios');

/**
 * Email service using Resend's HTTP API (port 443 — never blocked by firewalls).
 * Set RESEND_API_KEY in Railway env vars.
 * Falls back to console-logging the link in dev when no key is present.
 */

const FROM_ADDRESS =
  process.env.RESEND_FROM || 'ROI Scout <onboarding@resend.dev>';

const emailService = {
  /**
   * Send a password-reset email.
   * @param {string} toEmail  - recipient
   * @param {string} resetUrl - full https://... URL with token param
   */
  async sendPasswordResetEmail(toEmail, resetUrl) {
    const subject = 'Reset your ROI Scout password';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8;margin-bottom:8px">ROI Scout</h2>
        <h3 style="margin-top:0">Reset your password</h3>
        <p>Someone requested a password reset for the account associated with this email address.
           If that was you, click the button below. The link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:600">
          Reset password
        </a>
        <p style="color:#6b7280;font-size:13px">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color:#2563eb;word-break:break-all">${resetUrl}</a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">ROI Scout · Built for real estate investors</p>
      </div>
    `;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // Dev fallback — log reset link to console
      console.log('\n========== PASSWORD RESET (dev mode) ==========');
      console.log(`To: ${toEmail}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('================================================\n');
      return;
    }

    await axios.post(
      'https://api.resend.com/emails',
      {
        from: FROM_ADDRESS,
        to: [toEmail],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
  },
};

module.exports = emailService;
