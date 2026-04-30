const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticateToken, requirePlan } = require('../middleware/auth');
const { validateSaveSearch } = require('../middleware/validation');

const router = express.Router();

// All search routes require authentication
router.use(authenticateToken);

// GET /api/searches - Get user's saved searches
router.get('/', searchController.getSavedSearches);

// POST /api/searches - Save a new search (Basic+ only)
router.post('/', requirePlan('basic'), validateSaveSearch, searchController.saveSearch);

// DELETE /api/searches/:id - Delete a saved search
router.delete('/:id', searchController.deleteSavedSearch);

module.exports = router;
