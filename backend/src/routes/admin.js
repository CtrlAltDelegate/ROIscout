const express = require('express');
const dbOptimizationService = require('../services/dbOptimizationService');
const cacheService = require('../services/cacheService');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Middleware to check admin privileges (you can implement role-based access)
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Check if user is admin (you can implement this based on your user roles)
    const result = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For now, check if email contains 'admin' or is in admin list
    const email = result.rows[0].email;
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
    
    if (!email.includes('admin') && !adminEmails.includes(email)) {
      return res.status(403).json({ 
        error: 'Access Denied',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin privileges' });
  }
};

router.use(requireAdmin);

// GET /api/admin/health - System health check
router.get('/health', async (req, res) => {
  try {
    const health = await dbOptimizationService.checkDatabaseHealth();
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// GET /api/admin/performance - Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = await dbOptimizationService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// POST /api/admin/optimize - Run database optimization
router.post('/optimize', async (req, res) => {
  try {
    const result = await dbOptimizationService.optimizeDatabase();
    res.json(result);
  } catch (error) {
    console.error('Database optimization error:', error);
    res.status(500).json({
      error: 'Database optimization failed',
      message: error.message
    });
  }
});

// POST /api/admin/cache/clear - Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      await cacheService.delPattern(pattern);
      res.json({ 
        message: `Cache cleared for pattern: ${pattern}`,
        pattern 
      });
    } else {
      // Clear all cache
      await cacheService.delPattern('*');
      res.json({ 
        message: 'All cache cleared' 
      });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// GET /api/admin/cache/stats - Cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

// GET /api/admin/logs - System logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    const logs = await dbOptimizationService.getSystemLogs(
      parseInt(limit), 
      type || null
    );
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      error: 'Failed to get system logs',
      message: error.message
    });
  }
});

// POST /api/admin/refresh-views - Refresh materialized views
router.post('/refresh-views', async (req, res) => {
  try {
    await dbOptimizationService.refreshMaterializedViews();
    res.json({ 
      message: 'Materialized views refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh views error:', error);
    res.status(500).json({
      error: 'Failed to refresh materialized views',
      message: error.message
    });
  }
});

// GET /api/admin/stats - System statistics
router.get('/stats', async (req, res) => {
  try {
    // Get various system statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE subscription_status != 'free') as paid_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d
      FROM users
    `);

    const propertyStats = await query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(*) FILTER (WHERE is_active = true) as active_properties,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_properties_30d,
        AVG(price_to_rent_ratio) FILTER (WHERE price_to_rent_ratio > 0) as avg_ratio
      FROM properties
    `);

    const usageStats = await query(`
      SELECT 
        action_type,
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as actions_30d
      FROM usage_records
      GROUP BY action_type
      ORDER BY total_actions DESC
    `);

    const subscriptionStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY status
    `);

    res.json({
      users: userStats.rows[0],
      properties: propertyStats.rows[0],
      usage: usageStats.rows,
      subscriptions: subscriptionStats.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get system statistics',
      message: error.message
    });
  }
});

// POST /api/admin/cleanup - Run data cleanup
router.post('/cleanup', async (req, res) => {
  try {
    await dbOptimizationService.cleanupOldData();
    res.json({ 
      message: 'Data cleanup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data cleanup error:', error);
    res.status(500).json({
      error: 'Data cleanup failed',
      message: error.message
    });
  }
});

// GET /api/admin/database/tables - Database table information
router.get('/database/tables', async (req, res) => {
  try {
    const tables = await query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    res.json({ tables: tables.rows });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      error: 'Failed to get table information',
      message: error.message
    });
  }
});

module.exports = router;
