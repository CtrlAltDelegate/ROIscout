const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// POST /api/subscribe  — landing page email capture
router.post('/', async (req, res) => {
  const { email, source = 'landing_page' } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    await query(
      `INSERT INTO email_subscribers (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase().trim(), source]
    );
    // Always 200 — don't reveal whether the email already existed
    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.status(500).json({ error: 'Could not save subscription' });
  }
});

module.exports = router;
