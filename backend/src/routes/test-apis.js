const express = require('express');
const realEstateDataService = require('../services/realEstateDataService');

const router = express.Router();

/**
 * Test API integrations
 * GET /api/test/apis
 */
router.get('/apis', async (req, res) => {
  try {
    console.log('🧪 Testing API integrations...');
    
    const results = {
      timestamp: new Date().toISOString(),
      apis: {},
      sample_data: {}
    };

    // Test FRED API (Mortgage Rates)
    console.log('📊 Testing FRED API...');
    try {
      const mortgageRates = await realEstateDataService.getCurrentMortgageRates();
      results.apis.fred = {
        status: 'success',
        data: mortgageRates,
        message: 'Mortgage rates retrieved successfully'
      };
      console.log('✅ FRED API working:', mortgageRates);
    } catch (error) {
      results.apis.fred = {
        status: 'error',
        error: error.message,
        message: 'FRED API failed - using fallback rates'
      };
      console.log('❌ FRED API error:', error.message);
    }

    // Test RentCast API (Rental Estimate)
    console.log('🏠 Testing RentCast API...');
    try {
      const rentalEstimate = await realEstateDataService.getRentalEstimate(
        '123 Main St',
        'Austin',
        'TX',
        '78701',
        3, // bedrooms
        2, // bathrooms
        1500 // square feet
      );
      results.apis.rentcast = {
        status: 'success',
        data: rentalEstimate,
        message: 'Rental estimate retrieved successfully'
      };
      console.log('✅ RentCast API working:', rentalEstimate);
    } catch (error) {
      results.apis.rentcast = {
        status: 'error',
        error: error.message,
        message: 'RentCast API failed - using market-based estimation'
      };
      console.log('❌ RentCast API error:', error.message);
    }

    // Test Enhanced ROI Calculation
    console.log('💰 Testing Enhanced ROI Calculation...');
    try {
      const sampleProperty = {
        listPrice: 300000,
        estimatedRent: 2500
      };
      
      const mortgageRates = results.apis.fred.status === 'success' 
        ? results.apis.fred.data 
        : { thirtyYear: 6.46, fifteenYear: 5.91 };

      const roiCalculation = await realEstateDataService.calculateEnhancedROI(
        sampleProperty,
        mortgageRates,
        20 // 20% down payment
      );

      results.sample_data.roi_calculation = {
        status: 'success',
        property: sampleProperty,
        mortgage_rates: mortgageRates,
        roi_metrics: roiCalculation,
        message: 'ROI calculation completed successfully'
      };
      console.log('✅ ROI Calculation working:', roiCalculation);
    } catch (error) {
      results.sample_data.roi_calculation = {
        status: 'error',
        error: error.message,
        message: 'ROI calculation failed'
      };
      console.log('❌ ROI Calculation error:', error.message);
    }

    // Test Property Data Generation
    console.log('🏘️ Testing Property Data...');
    try {
      const sampleProperties = await realEstateDataService.fetchPropertyListings({
        city: 'Austin',
        state: 'TX',
        limit: 5
      });

      results.sample_data.properties = {
        status: 'success',
        count: sampleProperties.length,
        sample: sampleProperties.slice(0, 2), // Just show first 2 for brevity
        message: `Retrieved ${sampleProperties.length} properties`
      };
      console.log(`✅ Property Data: ${sampleProperties.length} properties`);
    } catch (error) {
      results.sample_data.properties = {
        status: 'error',
        error: error.message,
        message: 'Property data generation failed'
      };
      console.log('❌ Property Data error:', error.message);
    }

    // Overall status
    const successCount = Object.values(results.apis).filter(api => api.status === 'success').length;
    const totalApis = Object.keys(results.apis).length;
    
    results.overall_status = {
      apis_working: `${successCount}/${totalApis}`,
      ready_for_production: successCount >= 1, // At least one API working
      recommendations: []
    };

    if (results.apis.fred?.status === 'success') {
      results.overall_status.recommendations.push('✅ Real mortgage rates active');
    } else {
      results.overall_status.recommendations.push('⚠️ Add FRED_API_KEY for real mortgage rates');
    }

    if (results.apis.rentcast?.status === 'success') {
      results.overall_status.recommendations.push('✅ Real rental data active');
    } else {
      results.overall_status.recommendations.push('⚠️ Check RENTCAST_API_KEY for real rental data');
    }

    console.log('🎯 API Test Complete:', results.overall_status);

    res.json({
      success: true,
      message: 'API integration test completed',
      results
    });

  } catch (error) {
    console.error('❌ API Test Failed:', error);
    res.status(500).json({
      success: false,
      error: 'API test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test specific property ROI calculation
 * POST /api/test/roi
 */
router.post('/roi', async (req, res) => {
  try {
    const { listPrice, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, downPaymentPercent } = req.body;

    if (!listPrice || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['listPrice', 'address']
      });
    }

    console.log(`🧮 Testing ROI for: ${address}`);

    // Get rental estimate
    const rentalEstimate = await realEstateDataService.getRentalEstimate(
      address,
      city || 'Austin',
      state || 'TX',
      zipCode || '78701',
      bedrooms || 3,
      bathrooms || 2,
      squareFeet || 1500
    );

    // Get current mortgage rates
    const mortgageRates = await realEstateDataService.getCurrentMortgageRates();

    // Calculate ROI
    const roiMetrics = await realEstateDataService.calculateEnhancedROI(
      {
        listPrice: parseInt(listPrice),
        estimatedRent: rentalEstimate.estimate
      },
      mortgageRates,
      downPaymentPercent || 20
    );

    res.json({
      success: true,
      property: {
        address,
        city: city || 'Austin',
        state: state || 'TX',
        listPrice: parseInt(listPrice),
        estimatedRent: rentalEstimate.estimate
      },
      rental_estimate: rentalEstimate,
      mortgage_rates: mortgageRates,
      roi_metrics: roiMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ROI Test Failed:', error);
    res.status(500).json({
      success: false,
      error: 'ROI calculation failed',
      message: error.message
    });
  }
});

module.exports = router;
