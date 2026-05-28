-- Migration 012: Add lat/lng columns for geographic map rendering
-- Run once: psql $DATABASE_URL -f database/migrations/012_add_lat_lng.sql

ALTER TABLE zip_data ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6);
ALTER TABLE zip_data ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);

CREATE INDEX IF NOT EXISTS idx_zip_data_lat_lng
  ON zip_data(lat, lng) WHERE lat IS NOT NULL;
