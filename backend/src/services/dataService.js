const { query } = require('../config/database');
const externalAPI = require('./externalAPI');

const dataService = {
  /**
   * Fetch and store data from external APIs
   */
  async fetchAndStoreData(filters) {
    try {
      console.log('Fetching data from external APIs for:', filters);

      // Try to fetch from Zillow/Rentometer APIs
      const data = await externalAPI.fetchRealEstateData(filters);

      if (data && data.length > 0) {
        await this.storeZipData(data);
        return data;
      }

      throw new Error('No data received from external APIs');
    } catch (error) {
      console.error('Failed to fetch external data:', error);
      throw error;
    }
  },

  /**
   * Store zip code data in database
   */
  async storeZipData(dataArray) {
    try {
      for (const item of dataArray) {
        await query(
          `INSERT INTO zip_data (
            zip_code, state, county, median_price, median_rent,
            rent_to_price_ratio, gross_rental_yield, grm, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          ON CONFLICT (zip_code, state) 
          DO UPDATE SET
            median_price = EXCLUDED.median_price,
            median_rent = EXCLUDED.median_rent,
            rent_to_price_ratio = EXCLUDED.rent_to_price_ratio,
            gross_rental_yield = EXCLUDED.gross_rental_yield,
            grm = EXCLUDED.grm,
            last_updated = CURRENT_TIMESTAMP`,
          [
            item.zipCode,
            item.state,
            item.county,
            item.medianPrice,
            item.medianRent,
            item.rentToPriceRatio,
            item.grossRentalYield,
            item.grm
          ]
        );
      }
      console.log(`Stored ${dataArray.length} records in database`);
    } catch (error) {
      console.error('Failed to store zip data:', error);
      throw error;
    }
  },

  /**
   * Calculate ROI metrics
   */
  calculateROIMetrics(medianPrice, medianRent) {
    if (!medianPrice || !medianRent || medianPrice <= 0 || medianRent <= 0) {
      return {
        rentToPriceRatio: null,
        grossRentalYield: null,
        grm: null,
      };
    }

    const annualRent = medianRent * 12;
    const rentToPriceRatio = annualRent / medianPrice;
    const grossRentalYield = (annualRent / medianPrice) * 100;
    const grm = medianPrice / annualRent;

    return {
      rentToPriceRatio: Math.round(rentToPriceRatio * 1000) / 1000, // 3 decimal places
      grossRentalYield: Math.round(grossRentalYield * 100) / 100, // 2 decimal places
      grm: Math.round(grm * 100) / 100, // 2 decimal places
    };
  },

  /**
   * Fetch real data from database instead of generating sample data
   */
  async fetchRealData(filters) {
    try {
      const { query } = require('../config/database');
      
      // Build query conditions
      const conditions = [];
      const params = [];
      let paramCount = 0;

      if (filters.state) {
        paramCount++;
        conditions.push(`state = $${paramCount}`);
        params.push(filters.state.toUpperCase());
      }

      if (filters.county) {
        paramCount++;
        conditions.push(`county ILIKE $${paramCount}`);
        params.push(`%${filters.county}%`);
      }

      if (filters.zipCode) {
        paramCount++;
        conditions.push(`zip_code = $${paramCount}`);
        params.push(filters.zipCode);
      }

      if (filters.minPrice) {
        paramCount++;
        conditions.push(`list_price >= $${paramCount}`);
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        paramCount++;
        conditions.push(`list_price <= $${paramCount}`);
        params.push(filters.maxPrice);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const queryText = `
        SELECT 
          zip_code,
          state,
          city as county,
          AVG(list_price)::INTEGER as median_price,
          AVG(estimated_rent)::INTEGER as median_rent,
          AVG(price_to_rent_ratio) as rent_to_price_ratio,
          AVG(cap_rate) as gross_rental_yield,
          AVG(list_price / NULLIF(estimated_rent * 12, 0)) as grm,
          MAX(last_updated) as last_updated,
          COUNT(*) as property_count
        FROM properties 
        ${whereClause}
        AND is_active = true
        AND list_price > 0
        AND estimated_rent > 0
        GROUP BY zip_code, state, city
        ORDER BY AVG(cap_rate) DESC
        LIMIT 50
      `;

      const result = await query(queryText, params);
      return result.rows;
      
    } catch (error) {
      console.error('Error fetching real data:', error);
      return [];
    }
  },

  /**
   * Get sample counties for a state
   */
  getSampleCounties(state) {
    const stateCounties = {
      'CA': [
        { name: 'Los Angeles County' },
        { name: 'San Diego County' },
        { name: 'Orange County' },
        { name: 'Riverside County' },
        { name: 'San Bernardino County' },
        { name: 'Santa Clara County' },
        { name: 'Alameda County' },
        { name: 'Sacramento County' }
      ],
      'TX': [
        { name: 'Harris County' },
        { name: 'Dallas County' },
        { name: 'Tarrant County' },
        { name: 'Bexar County' },
        { name: 'Travis County' },
        { name: 'Collin County' },
        { name: 'Denton County' },
        { name: 'Fort Bend County' }
      ],
      'FL': [
        { name: 'Miami-Dade County' },
        { name: 'Broward County' },
        { name: 'Palm Beach County' },
        { name: 'Hillsborough County' },
        { name: 'Orange County' },
        { name: 'Pinellas County' },
        { name: 'Duval County' },
        { name: 'Lee County' }
      ],
      'NY': [
        { name: 'Kings County' },
        { name: 'Queens County' },
        { name: 'New York County' },
        { name: 'Suffolk County' },
        { name: 'Bronx County' },
        { name: 'Nassau County' },
        { name: 'Westchester County' },
        { name: 'Erie County' }
      ]
    };

    return stateCounties[state?.toUpperCase()] || [
      { name: 'County A' },
      { name: 'County B' },
      { name: 'County C' },
      { name: 'County D' }
    ];
  },

  /**
   * Get sample zip codes for a county
   */
  getSampleZipCodes(county) {
    // Generate 10-15 sample zip codes
    const zipCodes = [];
    const baseZip = 10000 + Math.floor(Math.random() * 80000);
    
    for (let i = 0; i < 12; i++) {
      zipCodes.push({
        code: (baseZip + i).toString(),
        median_price: Math.floor(Math.random() * 300000) + 100000,
        median_rent: Math.floor(Math.random() * 2000) + 800
      });
    }

    return zipCodes;
  },

  /**
   * Get sample zip codes for a state
   */
  getSampleZipCodesForState(state) {
    const stateZips = {
      'CA': ['90210', '90211', '90025', '90064', '90405', '91302', '91303', '91304', '90230', '90231'],
      'TX': ['75201', '75202', '75203', '75204', '75205', '77001', '77002', '77003', '77004', '77005'],
      'FL': ['33101', '33102', '33103', '33104', '33105', '33106', '33107', '33108', '33109', '33110'],
      'NY': ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010']
    };

    return stateZips[state?.toUpperCase()] || 
           Array.from({ length: 20 }, (_, i) => (10000 + Math.floor(Math.random() * 80000)).toString());
  }
};

module.exports = dataService;
