// Real Estate Data Integration Service
// Handles multiple data sources for property and rental information

const axios = require('axios');
const { query } = require('../config/database');

class RealEstateDataService {
  constructor() {
    // API configurations
    this.apis = {
      // Primary property data sources
      rentcast: {
        baseUrl: 'https://api.rentcast.io/v1',
        key: process.env.RENTCAST_API_KEY,
        enabled: !!process.env.RENTCAST_API_KEY
      },
      
      // Alternative rental data sources
      rentometer: {
        baseUrl: 'https://api.rentometer.com/v1',
        key: process.env.RENTOMETER_API_KEY,
        enabled: !!process.env.RENTOMETER_API_KEY
      },
      
      // Property listing data
      bridgeApi: {
        baseUrl: 'https://api.bridgedataoutput.com/api/v2',
        key: process.env.BRIDGE_API_KEY,
        enabled: !!process.env.BRIDGE_API_KEY
      },
      
      // Mortgage rate data
      fredApi: {
        baseUrl: 'https://api.stlouisfed.org/fred/series/observations',
        key: process.env.FRED_API_KEY,
        enabled: !!process.env.FRED_API_KEY
      }
    };
    
    // Rate limiting
    this.rateLimits = new Map();
    this.maxRequestsPerMinute = 60;
  }

  /**
   * Get current mortgage rates from Federal Reserve Economic Data (FRED)
   */
  async getCurrentMortgageRates() {
    try {
      if (!this.apis.fredApi.enabled) {
        // Return current market rates as fallback
        return {
          thirtyYear: 6.46,
          fifteenYear: 5.91,
          source: 'fallback',
          lastUpdated: new Date().toISOString()
        };
      }

      const response = await axios.get(this.apis.fredApi.baseUrl, {
        params: {
          series_id: 'MORTGAGE30US', // 30-Year Fixed Rate Mortgage Average
          api_key: this.apis.fredApi.key,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      const data = response.data.observations[0];
      const thirtyYearRate = parseFloat(data.value);

      // Get 15-year rate
      const fifteenYearResponse = await axios.get(this.apis.fredApi.baseUrl, {
        params: {
          series_id: 'MORTGAGE15US',
          api_key: this.apis.fredApi.key,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      const fifteenYearRate = parseFloat(fifteenYearResponse.data.observations[0].value);

      return {
        thirtyYear: thirtyYearRate,
        fifteenYear: fifteenYearRate,
        source: 'FRED',
        lastUpdated: data.date
      };

    } catch (error) {
      console.error('Error fetching mortgage rates:', error);
      // Return fallback rates
      return {
        thirtyYear: 6.46,
        fifteenYear: 5.91,
        source: 'fallback',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get rental estimates for a property
   */
  async getRentalEstimate(address, city, state, zipCode, bedrooms, bathrooms, squareFeet) {
    const estimates = [];

    // Try RentCast API
    if (this.apis.rentcast.enabled) {
      try {
        const rentCastEstimate = await this.fetchRentCastData({
          address, city, state, zipCode, bedrooms, bathrooms, squareFeet
        });
        if (rentCastEstimate) estimates.push(rentCastEstimate);
      } catch (error) {
        console.error('RentCast API error:', error);
      }
    }

    // Try Rentometer API
    if (this.apis.rentometer.enabled) {
      try {
        const rentometerEstimate = await this.fetchRentometerData({
          city, state, bedrooms, bathrooms
        });
        if (rentometerEstimate) estimates.push(rentometerEstimate);
      } catch (error) {
        console.error('Rentometer API error:', error);
      }
    }

    // If no API data, use market-based estimation
    if (estimates.length === 0) {
      const marketEstimate = await this.calculateMarketBasedRent({
        city, state, zipCode, bedrooms, bathrooms, squareFeet
      });
      estimates.push(marketEstimate);
    }

    // Return weighted average of estimates
    return this.calculateWeightedRentalEstimate(estimates);
  }

  /**
   * Fetch property listings from RentCast or Bridge API
   */
  async fetchPropertyListings(filters = {}) {
    // Try RentCast first (has 140M+ properties)
    if (this.apis.rentcast.enabled) {
      try {
        return await this.fetchRentCastProperties(filters);
      } catch (error) {
        console.error('RentCast properties error:', error);
        // Fall through to Bridge API or sample data
      }
    }

    // Fallback to Bridge API
    if (!this.apis.bridgeApi.enabled) {
      console.log('No property APIs configured, using sample data');
      return this.generateSamplePropertyData(filters);
    }

    try {
      const response = await axios.get(`${this.apis.bridgeApi.baseUrl}/listings`, {
        headers: {
          'Authorization': `Bearer ${this.apis.bridgeApi.key}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: filters.limit || 100,
          city: filters.city,
          state: filters.state,
          zip: filters.zipCode,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          propertyType: filters.propertyType,
          status: 'Active'
        }
      });

      return this.transformBridgeApiData(response.data);

    } catch (error) {
      console.error('Bridge API error:', error);
      return this.generateSamplePropertyData(filters);
    }
  }

  /**
   * RentCast API integration
   */
  async fetchRentCastData(propertyData) {
    try {
      // RentCast uses GET request with query parameters
      const response = await axios.get(`${this.apis.rentcast.baseUrl}/avm/rent/long-term`, {
        headers: {
          'X-Api-Key': this.apis.rentcast.key,
          'Content-Type': 'application/json'
        },
        params: {
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zipCode: propertyData.zipCode,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          squareFeet: propertyData.squareFeet,
          propertyType: 'Single Family' // Default, can be made dynamic
        }
      });

      // RentCast returns rent estimate in response.rent
      return {
        estimate: Math.round(response.data.rent || 0),
        confidence: response.data.confidence || 0.8,
        source: 'RentCast',
        weight: 0.5, // Higher weight as RentCast is very reliable
        details: {
          rentHigh: response.data.rentHigh,
          rentLow: response.data.rentLow,
          rentRangeLow: response.data.rentRangeLow,
          rentRangeHigh: response.data.rentRangeHigh
        }
      };
    } catch (error) {
      console.error('RentCast API detailed error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * RentCast Property Search
   */
  async fetchRentCastProperties(filters = {}) {
    try {
      const response = await axios.get(`${this.apis.rentcast.baseUrl}/listings/rental`, {
        headers: {
          'X-Api-Key': this.apis.rentcast.key,
          'Content-Type': 'application/json'
        },
        params: {
          city: filters.city,
          state: filters.state,
          zipCode: filters.zipCode,
          bedrooms: filters.bedrooms,
          bathrooms: filters.bathrooms,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          propertyType: filters.propertyType,
          limit: Math.min(filters.limit || 50, 100), // RentCast max is usually 100
          status: 'Active'
        }
      });

      return this.transformRentCastData(response.data);

    } catch (error) {
      console.error('RentCast properties API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Transform RentCast data to our format
   */
  transformRentCastData(apiData) {
    return apiData.listings?.map(listing => ({
      id: listing.id || `rentcast_${listing.address?.replace(/\s+/g, '_')}`,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode,
      latitude: listing.latitude,
      longitude: listing.longitude,
      listPrice: listing.price || listing.listPrice,
      estimatedRent: listing.rent || listing.estimatedRent,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFeet: listing.squareFeet,
      propertyType: listing.propertyType || 'Single Family',
      dataSource: 'RentCast',
      lastUpdated: listing.lastSeen || new Date().toISOString(),
      isActive: true,
      // Additional RentCast specific data
      rentCastData: {
        confidence: listing.confidence,
        rentHigh: listing.rentHigh,
        rentLow: listing.rentLow,
        pricePerSqFt: listing.pricePerSqFt,
        daysOnMarket: listing.daysOnMarket
      }
    })) || [];
  }

  /**
   * Rentometer API integration
   */
  async fetchRentometerData(propertyData) {
    const response = await axios.get(`${this.apis.rentometer.baseUrl}/summary`, {
      params: {
        api_key: this.apis.rentometer.key,
        city: propertyData.city,
        state: propertyData.state,
        bedrooms: propertyData.bedrooms
      }
    });

    return {
      estimate: response.data.rent,
      confidence: response.data.confidence || 0.7,
      source: 'Rentometer',
      weight: 0.3
    };
  }

  /**
   * Market-based rental estimation using local data
   */
  async calculateMarketBasedRent(propertyData) {
    try {
      // Query similar properties in the area
      const similarProperties = await query(`
        SELECT AVG(estimated_rent) as avg_rent, COUNT(*) as count
        FROM properties 
        WHERE city = $1 AND state = $2 
          AND bedrooms = $3 
          AND bathrooms = $4
          AND is_active = true
          AND estimated_rent > 0
      `, [propertyData.city, propertyData.state, propertyData.bedrooms, propertyData.bathrooms]);

      if (similarProperties.rows[0].count > 0) {
        const baseRent = parseFloat(similarProperties.rows[0].avg_rent);
        
        // Adjust for square footage if available
        let adjustedRent = baseRent;
        if (propertyData.squareFeet) {
          const avgSqFtRent = baseRent / 1500; // Assume 1500 sq ft average
          adjustedRent = avgSqFtRent * propertyData.squareFeet;
        }

        return {
          estimate: Math.round(adjustedRent),
          confidence: 0.6,
          source: 'Market Analysis',
          weight: 0.3
        };
      }

      // Fallback to regional averages
      const regionalAvg = await this.getRegionalRentalAverage(propertyData.state, propertyData.bedrooms);
      return {
        estimate: regionalAvg,
        confidence: 0.4,
        source: 'Regional Average',
        weight: 0.2
      };

    } catch (error) {
      console.error('Market-based estimation error:', error);
      return {
        estimate: this.getFallbackRent(propertyData.bedrooms),
        confidence: 0.3,
        source: 'Fallback',
        weight: 0.1
      };
    }
  }

  /**
   * Calculate weighted average of rental estimates
   */
  calculateWeightedRentalEstimate(estimates) {
    if (estimates.length === 0) {
      return { estimate: 0, confidence: 0, sources: [] };
    }

    const totalWeight = estimates.reduce((sum, est) => sum + est.weight, 0);
    const weightedSum = estimates.reduce((sum, est) => sum + (est.estimate * est.weight), 0);
    const avgConfidence = estimates.reduce((sum, est) => sum + est.confidence, 0) / estimates.length;

    return {
      estimate: Math.round(weightedSum / totalWeight),
      confidence: avgConfidence,
      sources: estimates.map(est => est.source),
      breakdown: estimates
    };
  }

  /**
   * Enhanced ROI calculation with mortgage rates
   */
  async calculateEnhancedROI(propertyData, mortgageRates, downPaymentPercent = 20) {
    const listPrice = propertyData.listPrice;
    const monthlyRent = propertyData.estimatedRent;
    const downPayment = listPrice * (downPaymentPercent / 100);
    const loanAmount = listPrice - downPayment;
    const monthlyRate = mortgageRates.thirtyYear / 100 / 12;
    const numPayments = 30 * 12;

    // Calculate monthly mortgage payment (P&I)
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Estimate other monthly costs
    const propertyTaxes = (listPrice * 0.012) / 12; // 1.2% annually
    const insurance = (listPrice * 0.003) / 12; // 0.3% annually
    const maintenance = monthlyRent * 0.1; // 10% of rent
    const vacancy = monthlyRent * 0.05; // 5% vacancy allowance

    const totalMonthlyCosts = monthlyMortgage + propertyTaxes + insurance + maintenance + vacancy;
    const monthlyCashFlow = monthlyRent - totalMonthlyCosts;
    const annualCashFlow = monthlyCashFlow * 12;

    // Cash-on-cash return
    const cashOnCashReturn = (annualCashFlow / downPayment) * 100;

    // Cap rate (if purchased with cash)
    const netOperatingIncome = (monthlyRent * 12) - ((propertyTaxes + insurance + maintenance + vacancy) * 12);
    const capRate = (netOperatingIncome / listPrice) * 100;

    // Price-to-rent ratio
    const priceToRentRatio = (monthlyRent * 12 / listPrice) * 100;

    return {
      cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      priceToRentRatio: Math.round(priceToRentRatio * 100) / 100,
      monthlyCashFlow: Math.round(monthlyCashFlow),
      monthlyMortgage: Math.round(monthlyMortgage),
      totalMonthlyCosts: Math.round(totalMonthlyCosts),
      downPaymentRequired: Math.round(downPayment),
      mortgageRate: mortgageRates.thirtyYear,
      calculations: {
        propertyTaxes: Math.round(propertyTaxes),
        insurance: Math.round(insurance),
        maintenance: Math.round(maintenance),
        vacancy: Math.round(vacancy)
      }
    };
  }

  /**
   * Get regional rental averages
   */
  async getRegionalRentalAverage(state, bedrooms) {
    const regionalAverages = {
      'TX': { 1: 1200, 2: 1500, 3: 1800, 4: 2200 },
      'CA': { 1: 2000, 2: 2500, 3: 3200, 4: 4000 },
      'FL': { 1: 1300, 2: 1600, 3: 2000, 4: 2500 },
      'NY': { 1: 1800, 2: 2200, 3: 2800, 4: 3500 }
    };

    return regionalAverages[state]?.[bedrooms] || 1500;
  }

  /**
   * Fallback rent estimation
   */
  getFallbackRent(bedrooms) {
    const fallbackRents = { 1: 1200, 2: 1500, 3: 1800, 4: 2200, 5: 2600 };
    return fallbackRents[bedrooms] || 1500;
  }

  /**
   * Generate sample property data for development
   */
  generateSamplePropertyData(filters = {}) {
    const sampleProperties = [];
    const cities = ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth'];
    const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'];
    
    for (let i = 0; i < (filters.limit || 50); i++) {
      const bedrooms = Math.floor(Math.random() * 4) + 2;
      const bathrooms = Math.floor(Math.random() * 3) + 1;
      const squareFeet = Math.floor(1200 + Math.random() * 2000);
      const listPrice = 150000 + Math.random() * 400000;
      
      // More realistic rent calculation
      const baseRentPerSqFt = 1.2 + Math.random() * 0.8; // $1.20-$2.00 per sq ft
      const estimatedRent = Math.round(squareFeet * baseRentPerSqFt);
      
      sampleProperties.push({
        id: `sample_${i + 1}`,
        address: `${1000 + i} Sample St`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: 'TX',
        zipCode: `7${String(Math.floor(Math.random() * 9000) + 1000)}`,
        latitude: 30.2672 + (Math.random() - 0.5) * 2,
        longitude: -97.7431 + (Math.random() - 0.5) * 2,
        listPrice: Math.round(listPrice),
        estimatedRent: estimatedRent,
        bedrooms,
        bathrooms,
        squareFeet,
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        dataSource: 'Sample Data',
        lastUpdated: new Date().toISOString(),
        isActive: true
      });
    }
    
    return sampleProperties;
  }

  /**
   * Transform Bridge API data to our format
   */
  transformBridgeApiData(apiData) {
    return apiData.listings?.map(listing => ({
      id: listing.listingId,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode,
      latitude: listing.latitude,
      longitude: listing.longitude,
      listPrice: listing.listPrice,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFeet: listing.squareFeet,
      propertyType: listing.propertyType,
      dataSource: 'Bridge API',
      lastUpdated: listing.lastModified,
      isActive: listing.status === 'Active'
    })) || [];
  }

  /**
   * Refresh property data with latest market information
   */
  async refreshPropertyData(propertyId) {
    try {
      // Get current property data
      const propertyResult = await query('SELECT * FROM properties WHERE id = $1', [propertyId]);
      if (propertyResult.rows.length === 0) {
        throw new Error('Property not found');
      }

      const property = propertyResult.rows[0];
      
      // Get fresh rental estimate
      const rentalEstimate = await this.getRentalEstimate(
        property.address,
        property.city,
        property.state,
        property.zip_code,
        property.bedrooms,
        property.bathrooms,
        property.square_feet
      );

      // Get current mortgage rates
      const mortgageRates = await this.getCurrentMortgageRates();

      // Calculate enhanced ROI metrics
      const roiMetrics = await this.calculateEnhancedROI({
        listPrice: property.list_price,
        estimatedRent: rentalEstimate.estimate
      }, mortgageRates);

      // Update property in database
      await query(`
        UPDATE properties 
        SET 
          estimated_rent = $1,
          price_to_rent_ratio = $2,
          cap_rate = $3,
          last_updated = NOW(),
          rental_confidence = $4,
          mortgage_rate_used = $5
        WHERE id = $6
      `, [
        rentalEstimate.estimate,
        roiMetrics.priceToRentRatio,
        roiMetrics.capRate,
        rentalEstimate.confidence,
        mortgageRates.thirtyYear,
        propertyId
      ]);

      return {
        success: true,
        property: {
          ...property,
          estimated_rent: rentalEstimate.estimate,
          price_to_rent_ratio: roiMetrics.priceToRentRatio,
          cap_rate: roiMetrics.capRate,
          rental_confidence: rentalEstimate.confidence,
          mortgage_rate_used: mortgageRates.thirtyYear
        },
        roiMetrics,
        rentalEstimate,
        mortgageRates
      };

    } catch (error) {
      console.error('Error refreshing property data:', error);
      throw error;
    }
  }
}

module.exports = new RealEstateDataService();
