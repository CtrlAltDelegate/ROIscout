const { query } = require('../config/database');
const dataService = require('../services/dataService');

const dataController = {
  /**
   * Get pricing data with ROI calculations
   */
  async getPricingData(req, res) {
    try {
      const filters = {
        state: req.query.state,
        county: req.query.county,
        zipCode: req.query.zipCode,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
        minRent: req.query.minRent ? parseInt(req.query.minRent) : null,
        propertyType: req.query.propertyType || '3bed2bath',
      };

      // Validate required parameters
      if (!filters.state) {
        return res.status(400).json({
          error: 'Missing Required Parameter',
          message: 'State parameter is required',
        });
      }

      // Build query conditions
      const conditions = ['state = $1'];
      const params = [filters.state.toUpperCase()];
      let paramCount = 1;

      if (filters.county) {
        paramCount++;
        conditions.push(`county = $${paramCount}`);
        params.push(filters.county);
      }

      if (filters.zipCode) {
        paramCount++;
        conditions.push(`zip_code = $${paramCount}`);
        params.push(filters.zipCode);
      }

      if (filters.minPrice) {
        paramCount++;
        conditions.push(`median_price >= $${paramCount}`);
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        paramCount++;
        conditions.push(`median_price <= $${paramCount}`);
        params.push(filters.maxPrice);
      }

      if (filters.minRent) {
        paramCount++;
        conditions.push(`median_rent >= $${paramCount}`);
        params.push(filters.minRent);
      }

      // Add filters for properties with valid data
      conditions.push('median_price > 0');
      conditions.push('median_rent > 0');

      const queryText = `
        SELECT
          zip_code,
          state,
          county,
          median_price,
          median_rent,
          rent_sfr,
          hud_fmr_1br,
          hud_fmr_2br,
          hud_fmr_3br,
          hud_fmr_4br,
          rent_to_price_ratio,
          gross_rental_yield,
          grm,
          lat,
          lng,
          last_updated
        FROM zip_data
        WHERE ${conditions.join(' AND ')}
        ORDER BY gross_rental_yield DESC NULLS LAST
        LIMIT ${Math.min(parseInt(req.query.limit) || 500, 500)}
      `;

      const result = await query(queryText, params);

      // Return clean empty response when no data — no fallback to non-existent tables
      if (result.rows.length === 0) {
        return res.json({
          data: [],
          total: 0,
          filters,
          source: 'no_data',
          message: `No Zillow data available for ${filters.state}. Coverage is limited to states where Zillow publishes both ZHVI (price) and ZORI (rent) data.`,
          dataLastUpdated: null,
          dataSources: null,
        });
      }

      // Data freshness: use latest last_updated from result set for UI indicator
      const dataLastUpdated = result.rows.length > 0
        ? result.rows.reduce((latest, row) => {
            const rowDate = row.last_updated ? new Date(row.last_updated) : null;
            return !latest ? rowDate : (rowDate > latest ? rowDate : latest);
          }, null)
        : null;
      const dataSources = 'Zillow Research, HUD Fair Market Rents, Census Bureau';

      res.json({
        data: result.rows,
        total: result.rows.length,
        filters: filters,
        source: 'database',
        dataLastUpdated: dataLastUpdated ? dataLastUpdated.toISOString() : null,
        dataSources,
      });
    } catch (error) {
      console.error('Get pricing data error:', error);
      res.status(500).json({
        error: 'Failed to Get Data',
        message: 'Unable to retrieve pricing data',
      });
    }
  },

  /**
   * Get available states
   */
  async getStates(req, res) {
    // Full name lookup for display
    const STATE_NAMES = {
      AK:'Alaska',AL:'Alabama',AR:'Arkansas',AZ:'Arizona',CA:'California',
      CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
      GU:'Guam',HI:'Hawaii',IA:'Iowa',ID:'Idaho',IL:'Illinois',IN:'Indiana',
      KS:'Kansas',KY:'Kentucky',LA:'Louisiana',MA:'Massachusetts',MD:'Maryland',
      ME:'Maine',MI:'Michigan',MN:'Minnesota',MO:'Missouri',MS:'Mississippi',
      MT:'Montana',NC:'North Carolina',ND:'North Dakota',NE:'Nebraska',
      NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NV:'Nevada',
      NY:'New York',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
      RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',
      TX:'Texas',UT:'Utah',VA:'Virginia',VT:'Vermont',WA:'Washington',
      WI:'Wisconsin',WV:'West Virginia',WY:'Wyoming',
    };
    try {
      // Only return states that actually have data in zip_data
      const result = await query(
        `SELECT DISTINCT state FROM zip_data
         WHERE median_price > 0 AND median_rent > 0
         ORDER BY state`
      );
      const states = result.rows
        .filter(r => STATE_NAMES[r.state]) // exclude GU / territories
        .map(r => ({ code: r.state, name: STATE_NAMES[r.state] || r.state }));

      res.json({
        data: states,
        total: states.length,
      });
    } catch (error) {
      console.error('Get states error:', error);
      res.status(500).json({
        error: 'Failed to Get States',
        message: 'Unable to retrieve states list',
      });
    }
  },

  /**
   * Get counties for a state
   */
  async getCounties(req, res) {
    try {
      const { state } = req.params;

      if (!state || state.length !== 2) {
        return res.status(400).json({
          error: 'Invalid State',
          message: 'Please provide a valid 2-letter state code',
        });
      }

      const result = await query(
        `SELECT DISTINCT county as name, COUNT(*) as zip_count
         FROM zip_data 
         WHERE state = $1 AND county IS NOT NULL
         GROUP BY county
         ORDER BY county`,
        [state.toUpperCase()]
      );

      // If no counties found in database, return sample counties
      if (result.rows.length === 0) {
        const sampleCounties = dataService.getSampleCounties(state);
        return res.json({
          data: sampleCounties,
          total: sampleCounties.length,
          source: 'sample_data',
        });
      }

      res.json({
        data: result.rows,
        total: result.rows.length,
        source: 'database',
      });
    } catch (error) {
      console.error('Get counties error:', error);
      res.status(500).json({
        error: 'Failed to Get Counties',
        message: 'Unable to retrieve counties list',
      });
    }
  },

  /**
   * Get zip codes for a county
   */
  async getZipCodes(req, res) {
    try {
      const { county } = req.params;

      if (!county) {
        return res.status(400).json({
          error: 'Invalid County',
          message: 'Please provide a valid county name',
        });
      }

      const result = await query(
        `SELECT zip_code as code, median_price, median_rent
         FROM zip_data 
         WHERE county = $1 AND zip_code IS NOT NULL
         ORDER BY zip_code`,
        [county]
      );

      // If no zip codes found, return sample data
      if (result.rows.length === 0) {
        const sampleZips = dataService.getSampleZipCodes(county);
        return res.json({
          data: sampleZips,
          total: sampleZips.length,
          source: 'sample_data',
        });
      }

      res.json({
        data: result.rows,
        total: result.rows.length,
        source: 'database',
      });
    } catch (error) {
      console.error('Get zip codes error:', error);
      res.status(500).json({
        error: 'Failed to Get Zip Codes',
        message: 'Unable to retrieve zip codes list',
      });
    }
  },

  /**
   * Record a free-tier zip detail view. Returns usage status.
   * Free users: max 10 views/month. Resets at the start of each calendar month.
   */
  async recordZipView(req, res) {
    try {
      const userId = req.user.id;
      const plan = req.user.subscription_plan || req.user.plan || 'free';

      // Paid users: unlimited — just confirm access
      if (plan !== 'free') {
        return res.json({ allowed: true, plan, viewsUsed: null, limit: null });
      }

      const FREE_LIMIT = 10;

      // Load current counters
      const userRow = await query(
        'SELECT zip_views_this_month, zip_views_reset_date FROM users WHERE id = $1',
        [userId]
      );
      if (!userRow.rows.length) return res.status(404).json({ error: 'User not found' });

      let { zip_views_this_month: viewsUsed, zip_views_reset_date: resetDate } = userRow.rows[0];

      // Reset counter if we're in a new calendar month
      const now = new Date();
      const reset = new Date(resetDate);
      if (reset.getMonth() !== now.getMonth() || reset.getFullYear() !== now.getFullYear()) {
        await query(
          'UPDATE users SET zip_views_this_month = 0, zip_views_reset_date = CURRENT_DATE WHERE id = $1',
          [userId]
        );
        viewsUsed = 0;
      }

      if (viewsUsed >= FREE_LIMIT) {
        return res.status(403).json({
          error: 'view_limit_reached',
          allowed: false,
          viewsUsed,
          limit: FREE_LIMIT,
        });
      }

      // Increment and allow
      await query(
        'UPDATE users SET zip_views_this_month = zip_views_this_month + 1 WHERE id = $1',
        [userId]
      );

      return res.json({
        allowed: true,
        plan,
        viewsUsed: viewsUsed + 1,
        limit: FREE_LIMIT,
      });
    } catch (error) {
      console.error('Record zip view error:', error);
      res.status(500).json({ error: 'Failed to record view' });
    }
  },

  /**
   * Get analytics data: yield histogram + top states by avg yield
   */
  async getAnalytics(req, res) {
    try {
      const [histogramResult, statesResult] = await Promise.all([
        query(`
          SELECT
            CASE
              WHEN gross_rental_yield <  4  THEN 'Under 4%'
              WHEN gross_rental_yield <  6  THEN '4–6%'
              WHEN gross_rental_yield <  8  THEN '6–8%'
              WHEN gross_rental_yield < 10  THEN '8–10%'
              WHEN gross_rental_yield < 12  THEN '10–12%'
              ELSE '12%+'
            END                            AS bucket,
            COUNT(*)::int                  AS count,
            MIN(gross_rental_yield)        AS bucket_min
          FROM zip_data
          WHERE gross_rental_yield > 0 AND median_price > 0
          GROUP BY bucket
          ORDER BY MIN(gross_rental_yield)
        `),
        query(`
          SELECT
            state,
            ROUND(AVG(gross_rental_yield)::numeric, 2)  AS avg_yield,
            ROUND(AVG(median_price)::numeric, 0)        AS avg_price,
            ROUND(AVG(median_rent)::numeric, 0)         AS avg_rent,
            COUNT(*)::int                               AS zip_count
          FROM zip_data
          WHERE gross_rental_yield > 0 AND median_price > 0
          GROUP BY state
          ORDER BY avg_yield DESC
          LIMIT 15
        `),
      ]);

      res.json({
        yieldHistogram: histogramResult.rows,
        topStates: statesResult.rows,
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  },

  /**
   * Get global dashboard summary stats
   */
  async getStats(req, res) {
    try {
      const result = await query(`
        SELECT
          COUNT(*)                                          AS total_zips,
          COUNT(DISTINCT state)                            AS states_covered,
          ROUND(AVG(gross_rental_yield)::numeric, 2)       AS avg_yield,
          COUNT(*) FILTER (WHERE gross_rental_yield >= 10) AS exceptional_count,
          COUNT(*) FILTER (WHERE gross_rental_yield >= 8)  AS excellent_count,
          MAX(last_updated)                                AS data_last_updated
        FROM zip_data
        WHERE median_price > 0 AND median_rent > 0
      `);

      const row = result.rows[0];
      res.json({
        totalZips:       parseInt(row.total_zips),
        statesCovered:   parseInt(row.states_covered),
        avgYield:        parseFloat(row.avg_yield),
        exceptionalCount: parseInt(row.exceptional_count),
        excellentCount:  parseInt(row.excellent_count),
        dataLastUpdated: row.data_last_updated,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },
};

module.exports = dataController;
