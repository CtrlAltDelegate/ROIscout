CREATE TABLE IF NOT EXISTS zip_data (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  median_price INTEGER,
  median_rent INTEGER,
  rent_to_price_ratio DECIMAL(5,4),
  gross_rental_yield DECIMAL(5,2),
  grm DECIMAL(8,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zip_code, state)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_zip_data_state ON zip_data(state);
CREATE INDEX IF NOT EXISTS idx_zip_data_county ON zip_data(county);
CREATE INDEX IF NOT EXISTS idx_zip_data_yield ON zip_data(gross_rental_yield DESC);
CREATE INDEX IF NOT EXISTS idx_zip_data_price ON zip_data(median_price);
