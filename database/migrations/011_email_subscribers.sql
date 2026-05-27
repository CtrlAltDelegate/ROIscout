-- Email subscriber list for landing page "Stay Updated" form
CREATE TABLE IF NOT EXISTS email_subscribers (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  source     VARCHAR(50)  DEFAULT 'landing_page',
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_created_at
  ON email_subscribers (created_at DESC);
