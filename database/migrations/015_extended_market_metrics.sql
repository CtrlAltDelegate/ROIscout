-- Migration 015: Extended market metrics — indicators, affordability, bedroom prices
--
-- Market indicators (metro-level via CBSA crosswalk)
-- Bedroom-specific home values (zip-level from Zillow ZHVI by bedroom count)

ALTER TABLE zip_data
  -- Additional market indicators
  ADD COLUMN IF NOT EXISTS market_heat_index   DECIMAL(6,2),  -- Zillow market heat (higher = more seller-favored)
  ADD COLUMN IF NOT EXISTS renter_affordability DECIMAL(5,2), -- % of income needed to afford median rent
  ADD COLUMN IF NOT EXISTS sale_to_list_ratio   DECIMAL(5,3), -- median sale price / list price
  ADD COLUMN IF NOT EXISTS new_listings_count   INTEGER,       -- new listings per month (metro)
  ADD COLUMN IF NOT EXISTS median_list_price    INTEGER,       -- median active list price (metro, SFR)
  ADD COLUMN IF NOT EXISTS pct_above_list       DECIMAL(5,2),  -- % of homes sold above list price

  -- Bedroom-specific home values (zip-level Zillow ZHVI)
  ADD COLUMN IF NOT EXISTS price_sfr  INTEGER,  -- SFR-specific median home value
  ADD COLUMN IF NOT EXISTS price_1br  INTEGER,  -- 1-bedroom median home value
  ADD COLUMN IF NOT EXISTS price_2br  INTEGER,  -- 2-bedroom median home value
  ADD COLUMN IF NOT EXISTS price_3br  INTEGER,  -- 3-bedroom median home value
  ADD COLUMN IF NOT EXISTS price_4br  INTEGER,  -- 4-bedroom median home value
  ADD COLUMN IF NOT EXISTS price_5br  INTEGER;  -- 5+ bedroom median home value
