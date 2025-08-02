const express = require('express');
const dataController = require('../controllers/dataController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/data/pricing-data - Get ROI data with filters
router.get('/pricing-data', optionalAuth, dataController.getPricingData);

// GET /api/data/states - Get available states
router.get('/states', dataController.getStates);

// GET /api/data/counties/:state - Get counties for a state
router.get('/counties/:state', dataController.getCounties);

// GET /api/data/zipcodes/:county - Get zip codes for a county
router.get('/zipcodes/:county', dataController.getZipCodes);

module.exports = router;
