const express = require('express');
const { query } = require('../config/database');
const cacheService = require('../services/cacheService');
const dbOptimizationService = require('../services/dbOptimizationService');

const router = express.Router();

/**
 * Basic health check - always responds quickly
 */
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      memory: { status: 'unknown' },
      disk: { status: 'unknown' }
    }
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbTime = Date.now() - dbStart;
    
    healthCheck.checks.database = {
      status: 'healthy',
      responseTime: `${dbTime}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    healthCheck.status = 'DEGRADED';
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connection failed'
    };
  }

  // Redis health check
  try {
    if (cacheService.isConnected) {
      const redisStart = Date.now();
      await cacheService.set('health_check', 'ok', 10);
      const redisTime = Date.now() - redisStart;
      
      healthCheck.checks.redis = {
        status: 'healthy',
        responseTime: `${redisTime}ms`,
        message: 'Redis connection successful'
      };
    } else {
      healthCheck.checks.redis = {
        status: 'unavailable',
        message: 'Redis not connected (non-critical)'
      };
    }
  } catch (error) {
    healthCheck.checks.redis = {
      status: 'unhealthy',
      error: error.message,
      message: 'Redis connection failed (non-critical)'
    };
  }

  // Memory usage check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  healthCheck.checks.memory = {
    status: memUsagePercent > 90 ? 'warning' : 'healthy',
    used: `${memUsedMB}MB`,
    total: `${memTotalMB}MB`,
    percentage: `${memUsagePercent}%`,
    message: memUsagePercent > 90 ? 'High memory usage' : 'Memory usage normal'
  };

  // Overall status
  const unhealthyChecks = Object.values(healthCheck.checks)
    .filter(check => check.status === 'unhealthy');
  
  if (unhealthyChecks.length > 0) {
    healthCheck.status = 'UNHEALTHY';
  }

  // Set appropriate HTTP status
  const httpStatus = healthCheck.status === 'OK' ? 200 : 
                    healthCheck.status === 'DEGRADED' ? 200 : 503;

  res.status(httpStatus).json(healthCheck);
});

/**
 * Readiness check - for container orchestration
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if we can connect to database
    await query('SELECT 1');
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept traffic'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: 'Service is not ready to accept traffic',
      error: error.message
    });
  }
});

/**
 * Liveness check - for container orchestration
 */
router.get('/live', (req, res) => {
  // Simple check that the process is running
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Service is alive'
  });
});

/**
 * Database performance metrics (admin only)
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dbOptimizationService.getPerformanceMetrics();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
