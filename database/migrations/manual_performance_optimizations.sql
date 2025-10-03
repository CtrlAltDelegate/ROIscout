-- Performance optimizations for ROI Scout database

-- Additional indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_price_ratio_active 
ON properties (price_to_rent_ratio DESC, is_active) 
WHERE is_active = true AND price_to_rent_ratio > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_active 
ON properties (state, city, zip_code, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_type_price 
ON properties (property_type, list_price, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_bedrooms_bathrooms 
ON properties (bedrooms, bathrooms, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_created_at_desc 
ON properties (created_at DESC) 
WHERE is_active = true;

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_filters_composite 
ON properties (state, city, property_type, bedrooms, list_price, price_to_rent_ratio) 
WHERE is_active = true;

-- Index for usage tracking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_records_user_action_date 
ON usage_records (user_id, action_type, created_at DESC);

-- Index for subscription queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status_period 
ON subscriptions (status, current_period_end) 
WHERE status = 'active';

-- Optimize property metadata searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_metadata_gin 
ON properties USING GIN (property_metadata) 
WHERE property_metadata IS NOT NULL;

-- Create materialized view for market statistics (updated periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS market_stats_by_zip AS
SELECT 
    zip_code,
    state,
    city,
    COUNT(*) as total_properties,
    AVG(list_price)::INTEGER as avg_price,
    AVG(estimated_rent)::INTEGER as avg_rent,
    AVG(price_to_rent_ratio) as avg_ratio,
    AVG(cap_rate) as avg_cap_rate,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) as median_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY estimated_rent) as median_rent,
    MIN(list_price) as min_price,
    MAX(list_price) as max_price,
    COUNT(*) FILTER (WHERE price_to_rent_ratio > 6.0) as exceptional_deals,
    MAX(last_updated) as last_updated
FROM properties 
WHERE is_active = true 
  AND list_price > 0 
  AND estimated_rent > 0
GROUP BY zip_code, state, city
HAVING COUNT(*) >= 3; -- Only include areas with at least 3 properties

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_stats_zip_unique 
ON market_stats_by_zip (zip_code);

CREATE INDEX IF NOT EXISTS idx_market_stats_state_city 
ON market_stats_by_zip (state, city);

CREATE INDEX IF NOT EXISTS idx_market_stats_avg_ratio 
ON market_stats_by_zip (avg_ratio DESC);

-- Create function to refresh market stats
CREATE OR REPLACE FUNCTION refresh_market_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY market_stats_by_zip;
    PERFORM pg_notify('market_stats_refreshed', NOW()::text);
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for property analytics (commonly queried data)
CREATE MATERIALIZED VIEW IF NOT EXISTS property_analytics_cache AS
SELECT 
    p.id,
    p.external_id,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.latitude,
    p.longitude,
    p.property_type,
    p.bedrooms,
    p.bathrooms,
    p.square_feet,
    p.list_price,
    p.estimated_rent,
    p.price_to_rent_ratio,
    p.cap_rate,
    p.data_source,
    p.last_updated,
    -- Calculate derived metrics
    CASE 
        WHEN p.estimated_rent > 0 THEN 
            ROUND((p.list_price::decimal / (p.estimated_rent * 12)), 2)
        ELSE NULL 
    END as gross_rent_multiplier,
    -- Market comparison (vs zip average)
    CASE 
        WHEN ms.avg_ratio > 0 THEN
            ROUND(((p.price_to_rent_ratio / ms.avg_ratio - 1) * 100), 1)
        ELSE NULL
    END as ratio_vs_market_percent,
    -- Property score (0-100)
    CASE 
        WHEN p.price_to_rent_ratio > 0 THEN
            LEAST(100, GREATEST(0, 
                (p.price_to_rent_ratio * 10) + 
                (CASE WHEN p.cap_rate > 8 THEN 20 ELSE p.cap_rate * 2.5 END) +
                (CASE WHEN p.square_feet > 1500 THEN 10 ELSE p.square_feet / 150 END)
            ))
        ELSE 0
    END as investment_score
FROM properties p
LEFT JOIN market_stats_by_zip ms ON p.zip_code = ms.zip_code
WHERE p.is_active = true 
  AND p.list_price > 0 
  AND p.estimated_rent > 0;

-- Index for property analytics cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_analytics_id 
ON property_analytics_cache (id);

CREATE INDEX IF NOT EXISTS idx_property_analytics_location 
ON property_analytics_cache (state, city, zip_code);

CREATE INDEX IF NOT EXISTS idx_property_analytics_score 
ON property_analytics_cache (investment_score DESC);

CREATE INDEX IF NOT EXISTS idx_property_analytics_ratio 
ON property_analytics_cache (price_to_rent_ratio DESC);

-- Function to refresh property analytics cache
CREATE OR REPLACE FUNCTION refresh_property_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY property_analytics_cache;
    PERFORM pg_notify('property_analytics_refreshed', NOW()::text);
END;
$$ LANGUAGE plpgsql;

-- Create function to update property statistics
CREATE OR REPLACE FUNCTION update_property_stats()
RETURNS void AS $$
BEGIN
    -- Refresh both materialized views
    PERFORM refresh_market_stats();
    PERFORM refresh_property_analytics();
    
    -- Update table statistics
    ANALYZE properties;
    ANALYZE usage_records;
    ANALYZE subscriptions;
    
    -- Log the update
    INSERT INTO system_logs (log_type, message, created_at) 
    VALUES ('stats_update', 'Property statistics updated', NOW())
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

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

-- Create function to clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM usage_records 
    WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Add table partitioning for usage_records (for better performance with large datasets)
-- This would be implemented if the usage_records table grows very large

-- Create indexes for better authentication performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users (LOWER(email));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status 
ON users (subscription_status, subscription_plan) 
WHERE subscription_status != 'free';

-- Optimize saved searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_searches_user_updated 
ON saved_searches (user_id, updated_at DESC);

-- Add constraints for data integrity
ALTER TABLE properties 
ADD CONSTRAINT chk_properties_price_positive 
CHECK (list_price > 0 OR list_price IS NULL);

ALTER TABLE properties 
ADD CONSTRAINT chk_properties_rent_positive 
CHECK (estimated_rent > 0 OR estimated_rent IS NULL);

ALTER TABLE properties 
ADD CONSTRAINT chk_properties_ratio_reasonable 
CHECK (price_to_rent_ratio > 0 AND price_to_rent_ratio < 50 OR price_to_rent_ratio IS NULL);

-- Add partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_high_ratio 
ON properties (price_to_rent_ratio DESC, city, state) 
WHERE is_active = true AND price_to_rent_ratio > 6.0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_recent 
ON properties (created_at DESC, city, state) 
WHERE is_active = true AND created_at > NOW() - INTERVAL '30 days';

-- Create view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM properties WHERE is_active = true) as total_properties,
    (SELECT AVG(price_to_rent_ratio) FROM properties WHERE is_active = true AND price_to_rent_ratio > 0) as avg_ratio,
    (SELECT COUNT(*) FROM properties WHERE is_active = true AND price_to_rent_ratio > 6.0) as exceptional_deals,
    (SELECT COUNT(*) FROM users WHERE subscription_status != 'free') as paid_users,
    (SELECT COUNT(*) FROM properties WHERE is_active = true AND created_at > NOW() - INTERVAL '7 days') as recent_properties;

-- Grant necessary permissions
GRANT SELECT ON market_stats_by_zip TO PUBLIC;
GRANT SELECT ON property_analytics_cache TO PUBLIC;
GRANT SELECT ON dashboard_stats TO PUBLIC;
