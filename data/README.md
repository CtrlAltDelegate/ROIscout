# Data directory for free-sources pipeline

Place the following files here (or set `ZHVI_CSV_PATH` / `ZORI_CSV_PATH` to their paths).

## Required for Zillow-based ingestion

1. **Zillow ZHVI (ZIP Code level)**  
   - Source: [Zillow Research Data](https://www.zillow.com/research/data/) → **HOME VALUES** → Geography: **ZIP Code** → Download the CSV (e.g. “ZHVI All Homes – ZIP Code”).  
   - Save as e.g. `data/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` (or any name).  
   - The script expects a CSV with a region column (e.g. `RegionName` = 5-digit zip) and at least one numeric date column for the latest value.

2. **Zillow ZORI (ZIP Code level)**  
   - Same page → **RENTALS** → Geography: **ZIP Codes** → Download the CSV (e.g. “ZORI All Homes Plus Multifamily”).  
   - Save as e.g. `data/Zip_zori_uc_sfrcondomfr_sm_month.csv` (or any name).

## Optional

3. **Zip → State / County lookup**  
   - CSV with columns: `zip_code` (or `zip`), `state`, `county`.  
   - Used to fill `state` and `county` in `zip_data` when not present in the Zillow files.  
   - Set path via `--zip-lookup` or `ZIP_LOOKUP_CSV_PATH`.

4. **Census ACS**  
   - No file needed. Set `CENSUS_API_KEY` (get one at [Census API Key Signup](https://api.census.gov/data/key_signup.html)) and use `--census` or `--census-only` to fill or use Census median home value (B25077) and median gross rent (B25064) by ZCTA.

## Run

From **backend** (so `pg`, `axios`, `dotenv` resolve):

```bash
cd backend

# Dry run (no DB write; will fail until CSVs exist):
node ../scripts/ingest-zip-data-free-sources.js --dry-run

# After placing ZHVI and ZORI CSVs in repo data/:
node ../scripts/ingest-zip-data-free-sources.js

# Require at least 500 zips before beta:
node ../scripts/ingest-zip-data-free-sources.js --min-zips 500
```

Or set paths explicitly:

```bash
node ../scripts/ingest-zip-data-free-sources.js --zhvi ../data/zhvi_zip.csv --zori ../data/zori_zip.csv
```

Optional: `--zip-lookup ../data/zip_state_county.csv`, `--census` (needs `CENSUS_API_KEY`), `--limit N`. See script header for all options.
