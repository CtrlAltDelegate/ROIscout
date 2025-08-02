const { query } = require('../config/database');

const searchController = {
  /**
   * Get user's saved searches
   */
  async getSavedSearches(req, res) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT id, search_name, filters, created_at 
         FROM saved_searches 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        data: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error('Get saved searches error:', error);
      res.status(500).json({
        error: 'Failed to Get Saved Searches',
        message: 'Unable to retrieve saved searches',
      });
    }
  },

  /**
   * Save a new search
   */
  async saveSearch(req, res) {
    try {
      const userId = req.user.userId;
      const { searchName, filters } = req.body;

      // Check if user already has a search with this name
      const existingSearch = await query(
        'SELECT id FROM saved_searches WHERE user_id = $1 AND search_name = $2',
        [userId, searchName]
      );

      if (existingSearch.rows.length > 0) {
        return res.status(409).json({
          error: 'Duplicate Search Name',
          message: 'You already have a saved search with this name',
        });
      }

      // Check user's saved search limit (max 10 for MVP)
      const searchCount = await query(
        'SELECT COUNT(*) as count FROM saved_searches WHERE user_id = $1',
        [userId]
      );

      if (parseInt(searchCount.rows[0].count) >= 10) {
        return res.status(400).json({
          error: 'Search Limit Exceeded',
          message: 'You can save up to 10 searches. Please delete some to add new ones.',
        });
      }

      // Save the search
      const result = await query(
        `INSERT INTO saved_searches (user_id, search_name, filters) 
         VALUES ($1, $2, $3) 
         RETURNING id, search_name, filters, created_at`,
        [userId, searchName, JSON.stringify(filters)]
      );

      const savedSearch = result.rows[0];

      res.status(201).json({
        message: 'Search saved successfully',
        data: {
          id: savedSearch.id,
          search_name: savedSearch.search_name,
          filters: savedSearch.filters,
          created_at: savedSearch.created_at,
        },
      });
    } catch (error) {
      console.error('Save search error:', error);
      res.status(500).json({
        error: 'Failed to Save Search',
        message: 'Unable to save search',
      });
    }
  },

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(req, res) {
    try {
      const userId = req.user.userId;
      const searchId = req.params.id;

      if (!searchId || isNaN(searchId)) {
        return res.status(400).json({
          error: 'Invalid Search ID',
          message: 'Please provide a valid search ID',
        });
      }

      // Check if the search exists and belongs to the user
      const existingSearch = await query(
        'SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2',
        [searchId, userId]
      );

      if (existingSearch.rows.length === 0) {
        return res.status(404).json({
          error: 'Search Not Found',
          message: 'The specified search was not found',
        });
      }

      // Delete the search
      await query(
        'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2',
        [searchId, userId]
      );

      res.json({
        message: 'Search deleted successfully',
      });
    } catch (error) {
      console.error('Delete search error:', error);
      res.status(500).json({
        error: 'Failed to Delete Search',
        message: 'Unable to delete search',
      });
    }
  },
};

module.exports = searchController;
