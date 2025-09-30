const express = require('express');
const dataController = require('../controllers/dataController');
const { optionalAuth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const { validateQueryParams, addQueryHints } = require('../middleware/queryOptimization');

const router = express.Router();

// Apply query optimization middleware to all routes
router.use(validateQueryParams);
router.use(addQueryHints);

// GET /api/data/pricing-data - Get ROI data with filters (cached for 5 minutes)
router.get('/pricing-data', 
  optionalAuth, 
  cacheService.middleware(
    (req) => `pricing-data:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`,
    5 * 60 // 5 minutes
  ),
  dataController.getPricingData
);

// GET /api/data/states - Get available states (cached for 1 hour)
router.get('/states', 
  cacheService.middleware('states', 60 * 60), 
  dataController.getStates
);

// GET /api/data/counties/:state - Get counties for a state (cached for 1 hour)
router.get('/counties/:state', 
  cacheService.middleware(
    (req) => `counties:${req.params.state}`,
    60 * 60 // 1 hour
  ),
  dataController.getCounties
);

// GET /api/data/zipcodes/:county - Get zip codes for a county (cached for 1 hour)
router.get('/zipcodes/:county', 
  cacheService.middleware(
    (req) => `zipcodes:${req.params.county}`,
    60 * 60 // 1 hour
  ),
  dataController.getZipCodes
);

module.exports = router;
