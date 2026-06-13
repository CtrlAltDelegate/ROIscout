-- Migration 016: Add per-user alert settings
-- Lets Pro users control whether they receive yield alerts and at what threshold.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS alerts_enabled  BOOLEAN       DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(4,1)  DEFAULT 8.0;

COMMENT ON COLUMN users.alerts_enabled  IS 'Whether the user wants to receive yield alert emails (Pro only)';
COMMENT ON COLUMN users.alert_threshold IS 'Gross yield % that triggers an alert for this user (default 8.0)';
