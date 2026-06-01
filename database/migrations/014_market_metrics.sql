-- Migration 014: Add market depth metrics to zip_data
--
-- Growth rates (computed from Zillow ZHVI/ZORI historical monthly data)
-- Market indicators (from Zillow metro-level research CSVs)
-- Demographics (from Census ACS 5-year estimates)

ALTER TABLE zip_data
  -- Rent growth
  ADD COLUMN IF NOT EXISTS rent_growth_1yr    DECIMAL(6,2),  -- % YoY rent change
  ADD COLUMN IF NOT EXISTS rent_growth_3yr    DECIMAL(6,2),  -- % 3-year rent change

  -- Price appreciation
  ADD COLUMN IF NOT EXISTS price_growth_1yr   DECIMAL(6,2),  -- % YoY price change
  ADD COLUMN IF NOT EXISTS price_growth_5yr   DECIMAL(6,2),  -- % 5-year price change

  -- Market health (metro-level, mapped via CBSA)
  ADD COLUMN IF NOT EXISTS days_on_market     INTEGER,       -- median days to pending
  ADD COLUMN IF NOT EXISTS for_sale_inventory INTEGER,       -- active listing count
  ADD COLUMN IF NOT EXISTS price_cut_pct      DECIMAL(5,2),  -- % listings with price cuts

  -- Demographics (Census ACS)
  ADD COLUMN IF NOT EXISTS median_household_income  INTEGER,
  ADD COLUMN IF NOT EXISTS population               INTEGER,
  ADD COLUMN IF NOT EXISTS rent_to_income_ratio     DECIMAL(5,2); -- monthly rent / monthly income
