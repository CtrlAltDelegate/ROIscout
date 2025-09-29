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
          rent_to_price_ratio,
          gross_rental_yield,
          grm,
          last_updated
        FROM zip_data 
        WHERE ${conditions.join(' AND ')}
        ORDER BY gross_rental_yield DESC NULLS LAST
        LIMIT 500
      `;

      const result = await query(queryText, params);
      
      // If no data found, try to fetch real data from properties table
      if (result.rows.length === 0) {
        console.log('No data found in zip_data table, fetching from properties table...');
        try {
          const realData = await dataService.fetchRealData(filters);
          if (realData.length > 0) {
            return res.json({
              data: realData,
              total: realData.length,
              filters: filters,
              source: 'properties_table',
            });
          } else {
            return res.json({
              data: [],
              total: 0,
              filters: filters,
              source: 'no_data',
              message: 'No properties found matching your criteria. Try running data ingestion first.'
            });
          }
        } catch (error) {
          console.error('Error fetching real data:', error);
          return res.status(500).json({
            error: 'Data Fetch Failed',
            message: 'Unable to retrieve property data',
          });
        }
      }

      res.json({
        data: result.rows,
        total: result.rows.length,
        filters: filters,
        source: 'database',
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
    try {
      // Return hardcoded state list for reliability
      const states = [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
      ];

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
};

module.exports = dataController;
