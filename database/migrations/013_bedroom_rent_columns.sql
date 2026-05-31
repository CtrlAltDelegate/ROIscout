-- Migration 013: Add SFR ZORI and HUD FMR bedroom-level rent columns
--
-- rent_sfr      : Zillow SFR ZORI value for this zip's metro (single-family specific)
-- hud_fmr_1br–4br: HUD Fair Market Rent by bedroom count for this zip's county
--                  Used to compute bedroom ratios relative to 2BR base

ALTER TABLE zip_data
  ADD COLUMN IF NOT EXISTS rent_sfr     INTEGER,
  ADD COLUMN IF NOT EXISTS hud_fmr_1br  INTEGER,
  ADD COLUMN IF NOT EXISTS hud_fmr_2br  INTEGER,
  ADD COLUMN IF NOT EXISTS hud_fmr_3br  INTEGER,
  ADD COLUMN IF NOT EXISTS hud_fmr_4br  INTEGER;
