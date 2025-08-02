INSERT INTO users (email, password_hash) VALUES 
  ('demo@roiscout.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kEq8.Tqes'),
  ('investor@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kEq8.Tqes'),
  ('agent@realty.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kEq8.Tqes')
ON CONFLICT (email) DO NOTHING;

-- Sample zip data for demonstration
INSERT INTO zip_data (
  zip_code, state, county, median_price, median_rent, 
  rent_to_price_ratio, gross_rental_yield, grm
) VALUES 
  -- California samples
  ('90210', 'CA', 'Los Angeles County', 850000, 4500, 0.0635, 6.35, 15.74),
  ('90025', 'CA', 'Los Angeles County', 725000, 3800, 0.0628, 6.28, 15.92),
  ('91302', 'CA', 'Los Angeles County', 675000, 3200, 0.0568, 5.68, 17.58),
  ('90405', 'CA', 'Los Angeles County', 920000, 4800, 0.0626, 6.26, 15.98),
  
  -- Texas samples  
  ('75201', 'TX', 'Dallas County', 275000, 1950, 0.0851, 8.51, 11.75),
  ('75202', 'TX', 'Dallas County', 295000, 2100, 0.0854, 8.54, 11.71),
  ('77001', 'TX', 'Harris County', 245000, 1850, 0.0906, 9.06, 11.04),
  ('77002', 'TX', 'Harris County', 320000, 2400, 0.0900, 9.00, 11.11),
  
  -- Florida samples
  ('33101', 'FL', 'Miami-Dade County', 485000, 2800, 0.0693, 6.93, 14.44),
  ('33102', 'FL', 'Miami-Dade County', 525000, 3100, 0.0709, 7.09, 14.11),
  ('33480', 'FL', 'Palm Beach County', 395000, 2400, 0.0729, 7.29, 13.72),
  ('33483', 'FL', 'Palm Beach County', 425000, 2650, 0.0748, 7.48, 13.36),
  
  -- New York samples
  ('10001', 'NY', 'New York County', 1250000, 5200, 0.0499, 4.99, 20.03),
  ('10003', 'NY', 'New York County', 1100000, 4800, 0.0524, 5.24, 19.10),
  ('11201', 'NY', 'Kings County', 875000, 4200, 0.0576, 5.76, 17.36),
  ('11215', 'NY', 'Kings County', 795000, 3900, 0.0589, 5.89, 16.99),
  
  -- Ohio samples (higher yield examples)
  ('44113', 'OH', 'Cuyahoga County', 125000, 1100, 0.1056, 10.56, 9.47),
  ('44114', 'OH', 'Cuyahoga County', 135000, 1200, 0.1067, 10.67, 9.38),
  ('45202', 'OH', 'Hamilton County', 145000, 1250, 0.1034, 10.34, 9.67),
  ('45203', 'OH', 'Hamilton County', 155000, 1350, 0.1045, 10.45, 9.57),
  
  -- Michigan samples
  ('48201', 'MI', 'Wayne County', 85000, 850, 0.1200, 12.00, 8.33),
  ('48202', 'MI', 'Wayne County', 95000, 950, 0.1200, 12.00, 8.33),
  ('48226', 'MI', 'Wayne County', 75000, 800, 0.1280, 12.80, 7.81),
  ('48227', 'MI', 'Wayne County', 105000, 1050, 0.1200, 12.00, 8.33)

ON CONFLICT (zip_code, state) DO UPDATE SET
  median_price = EXCLUDED.median_price,
  median_rent = EXCLUDED.median_rent,
  rent_to_price_ratio = EXCLUDED.rent_to_price_ratio,
  gross_rental_yield = EXCLUDED.gross_rental_yield,
  grm = EXCLUDED.grm,
  last_updated = CURRENT_TIMESTAMP;

-- Sample saved searches for demo user
INSERT INTO saved_searches (user_id, search_name, filters) VALUES 
  (1, 'Texas High Yield', '{"state": "TX", "county": "", "zipCode": "", "minPrice": "", "maxPrice": "300000", "minRent": "1500", "propertyType": "3bed2bath"}'),
  (1, 'California Coastal', '{"state": "CA", "county": "Los Angeles County", "zipCode": "", "minPrice": "500000", "maxPrice": "", "minRent": "3000", "propertyType": "3bed2bath"}'),
  (1, 'Ohio Cash Flow', '{"state": "OH", "county": "", "zipCode": "", "minPrice": "", "maxPrice": "200000", "minRent": "1000", "propertyType": "3bed2bath"}')
ON CONFLICT DO NOTHING;
