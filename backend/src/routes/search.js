const express = require('express');
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');
const { validateSaveSearch } = require('../middleware/validation');

const router = express.Router();

// All search routes require authentication
router.use(authenticateToken);

// GET /api/searches - Get user's saved searches
router.get('/', searchController.getSavedSearches);

// POST /api/searches - Save a new search
router.post('/', validateSaveSearch, searchController.saveSearch);

// DELETE /api/searches/:id - Delete a saved search
router.delete('/:id', searchController.deleteSavedSearch);

module.exports = router;
