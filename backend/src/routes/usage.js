const express = require('express');
const usageService = require('../services/usageService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/usage/current-month - Get current month usage
router.get('/current-month', async (req, res) => {
  try {
    const userId = req.user.userId;
    const usage = await usageService.getCurrentMonthUsage(userId);
    
    res.json({
      usage,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    });
  } catch (error) {
    console.error('Get current month usage error:', error);
    res.status(500).json({
      error: 'Failed to get usage data',
      message: error.message
    });
  }
});

// GET /api/usage/limits - Get user's plan limits
router.get('/limits', async (req, res) => {
  try {
    const userId = req.user.userId;
    const limits = await usageService.getUserPlanLimits(userId);
    
    res.json({ limits });
  } catch (error) {
    console.error('Get usage limits error:', error);
    res.status(500).json({
      error: 'Failed to get usage limits',
      message: error.message
    });
  }
});

// GET /api/usage/check/:actionType - Check if action is allowed
router.get('/check/:actionType', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { actionType } = req.params;
    
    const limits = await usageService.getUserPlanLimits(userId);
    const actionLimit = limits[actionType];
    
    if (actionLimit === -1) {
      return res.json({ allowed: true, unlimited: true });
    }
    
    const usageCheck = await usageService.checkUsageLimit(userId, actionType, actionLimit);
    
    res.json(usageCheck);
  } catch (error) {
    console.error('Check usage limit error:', error);
    res.status(500).json({
      error: 'Failed to check usage limit',
      message: error.message
    });
  }
});

// GET /api/usage/history - Get usage history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;
    
    const usage = await usageService.getUserUsage(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      usage,
      period: {
        start: startDate || null,
        end: endDate || null
      }
    });
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({
      error: 'Failed to get usage history',
      message: error.message
    });
  }
});

module.exports = router;
