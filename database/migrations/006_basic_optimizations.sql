-- Basic performance optimizations for ROI Scout database (without CONCURRENTLY)

-- Basic indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_price_ratio_active 
ON properties (price_to_rent_ratio DESC, is_active) 
WHERE is_active = true AND price_to_rent_ratio > 0;

CREATE INDEX IF NOT EXISTS idx_properties_location_active 
ON properties (state, city, zip_code, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_type_price 
ON properties (property_type, list_price, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_created_at_desc 
ON properties (created_at DESC) 
WHERE is_active = true;

-- Index for usage tracking queries
CREATE INDEX IF NOT EXISTS idx_usage_records_user_action_date 
ON usage_records (user_id, action_type, created_at DESC);

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period 
ON subscriptions (status, current_period_end) 
WHERE status = 'active';

-- Create system logs table for tracking updates
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_type_date 
ON system_logs (log_type, created_at DESC);

-- Basic indexes for authentication performance
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users (LOWER(email));

-- Optimize saved searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_updated 
ON saved_searches (user_id, updated_at DESC);

-- Add constraints for data integrity
ALTER TABLE properties 
ADD CONSTRAINT IF NOT EXISTS chk_properties_price_positive 
CHECK (list_price > 0 OR list_price IS NULL);

ALTER TABLE properties 
ADD CONSTRAINT IF NOT EXISTS chk_properties_rent_positive 
CHECK (estimated_rent > 0 OR estimated_rent IS NULL);

ALTER TABLE properties 
ADD CONSTRAINT IF NOT EXISTS chk_properties_ratio_reasonable 
CHECK (price_to_rent_ratio > 0 AND price_to_rent_ratio < 50 OR price_to_rent_ratio IS NULL);

-- Create view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM properties WHERE is_active = true) as total_properties,
    (SELECT AVG(price_to_rent_ratio) FROM properties WHERE is_active = true AND price_to_rent_ratio > 0) as avg_ratio,
    (SELECT COUNT(*) FROM properties WHERE is_active = true AND price_to_rent_ratio > 6.0) as exceptional_deals,
    (SELECT COUNT(*) FROM users WHERE subscription_status != 'free') as paid_users,
    (SELECT COUNT(*) FROM properties WHERE is_active = true AND created_at > NOW() - INTERVAL '7 days') as recent_properties;
