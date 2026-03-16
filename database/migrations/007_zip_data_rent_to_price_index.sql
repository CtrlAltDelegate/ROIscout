-- Production hardening: index for filter + map queries (Launch Readiness plan)
-- Enables fast filtering/sorting by rent_to_price_ratio
CREATE INDEX IF NOT EXISTS idx_zip_data_rent_to_price_ratio
ON zip_data (rent_to_price_ratio DESC NULLS LAST)
WHERE median_price > 0 AND median_rent > 0;
