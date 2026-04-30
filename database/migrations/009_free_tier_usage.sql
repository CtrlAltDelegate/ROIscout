-- Migration 009: Free tier usage tracking
-- Adds monthly zip view counter to users table for free tier enforcement

ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_views_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_views_reset_date DATE DEFAULT CURRENT_DATE;

-- Ensure subscription_plan is set on all existing users
UPDATE users SET subscription_plan = 'free' WHERE subscription_plan IS NULL;
