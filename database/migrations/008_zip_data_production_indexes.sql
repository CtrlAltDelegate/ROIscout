-- Production hardening: zip_data indexes for filter + map at scale (Launch Readiness plan)
-- Confirms zip_code, state, rent_to_price_ratio (and common query pattern) are indexed.

-- Lookups by zip_code (e.g. filter by single zip)
CREATE INDEX IF NOT EXISTS idx_zip_data_zip_code ON zip_data (zip_code);

-- Main listing query: filter by state + order by gross_rental_yield DESC (limit 500)
CREATE INDEX IF NOT EXISTS idx_zip_data_state_yield
ON zip_data (state, gross_rental_yield DESC NULLS LAST)
WHERE median_price > 0 AND median_rent > 0;

-- rent_to_price_ratio already indexed in 007_zip_data_rent_to_price_index.sql
-- state already indexed in 002_create_zip_data.sql
