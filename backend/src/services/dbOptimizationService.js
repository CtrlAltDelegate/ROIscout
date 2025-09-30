const { query } = require('../config/database');
const cacheService = require('./cacheService');

class DatabaseOptimizationService {
  constructor() {
    this.refreshInterval = 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isRunning = false;
  }

  /**
   * Start background optimization tasks
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔧 Database optimization service started');

    // Refresh materialized views periodically
    this.refreshTimer = setInterval(() => {
      this.refreshMaterializedViews().catch(err => {
        console.error('Failed to refresh materialized views:', err);
      });
    }, this.refreshInterval);

    // Cleanup old data periodically
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData().catch(err => {
        console.error('Failed to cleanup old data:', err);
      });
    }, this.cleanupInterval);

    // Initial refresh
    setTimeout(() => {
      this.refreshMaterializedViews().catch(err => {
        console.error('Initial materialized view refresh failed:', err);
      });
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Stop background optimization tasks
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    console.log('🔧 Database optimization service stopped');
  }

  /**
   * Refresh materialized views
   */
  async refreshMaterializedViews() {
    try {
      console.log('🔄 Refreshing materialized views...');
      
      // Refresh market statistics
      await query('SELECT refresh_market_stats()');
      
      // Refresh property analytics cache
      await query('SELECT refresh_property_analytics()');
      
      // Invalidate related cache entries
      await cacheService.delPattern('analytics:*');
      await cacheService.delPattern('property_search:*');
      
      console.log('✅ Materialized views refreshed successfully');
      
      // Log the refresh
      await this.logSystemEvent('materialized_views_refresh', 'Materialized views refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh materialized views:', error);
      await this.logSystemEvent('materialized_views_refresh_error', error.message);
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData() {
    try {
      console.log('🧹 Cleaning up old data...');
      
      // Run cleanup function
      await query('SELECT cleanup_old_logs()');
      
      // Clean up old cache entries (Redis handles TTL, but we can force cleanup)
      if (cacheService.isConnected) {
        // This would clean up any expired keys
        await cacheService.client.eval(`
          local keys = redis.call('keys', ARGV[1])
          local deleted = 0
          for i=1,#keys do
            if redis.call('ttl', keys[i]) == -1 then
              redis.call('del', keys[i])
              deleted = deleted + 1
            end
          end
          return deleted
        `, 0, '*');
      }
      
      console.log('✅ Old data cleanup completed');
      
      await this.logSystemEvent('data_cleanup', 'Old data cleanup completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
      await this.logSystemEvent('data_cleanup_error', error.message);
    }
  }

  /**
   * Update table statistics
   */
  async updateTableStatistics() {
    try {
      console.log('📊 Updating table statistics...');
      
      // Update PostgreSQL statistics
      await query('ANALYZE properties');
      await query('ANALYZE usage_records');
      await query('ANALYZE subscriptions');
      await query('ANALYZE users');
      
      console.log('✅ Table statistics updated');
      
      await this.logSystemEvent('table_stats_update', 'Table statistics updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update table statistics:', error);
      await this.logSystemEvent('table_stats_update_error', error.message);
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase() {
    try {
      console.log('⚡ Running database optimization...');
      
      // Refresh materialized views
      await this.refreshMaterializedViews();
      
      // Update table statistics
      await this.updateTableStatistics();
      
      // Cleanup old data
      await this.cleanupOldData();
      
      console.log('✅ Database optimization completed');
      
      return {
        success: true,
        message: 'Database optimization completed successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics() {
    try {
      // Get table sizes
      const tableSizes = await query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      // Get index usage statistics
      const indexStats = await query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20
      `);

      // Get slow queries (if pg_stat_statements is enabled)
      let slowQueries = [];
      try {
        slowQueries = await query(`
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY mean_time DESC
          LIMIT 10
        `);
      } catch (err) {
        // pg_stat_statements might not be enabled
        console.log('pg_stat_statements not available');
      }

      // Get cache hit ratio
      const cacheHitRatio = await query(`
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
        FROM pg_statio_user_tables
      `);

      // Get connection stats
      const connectionStats = await query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      `);

      return {
        tableSizes: tableSizes.rows,
        indexStats: indexStats.rows,
        slowQueries: slowQueries.rows || [],
        cacheHitRatio: cacheHitRatio.rows[0],
        connectionStats: connectionStats.rows[0],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Log system events
   */
  async logSystemEvent(eventType, message, metadata = {}) {
    try {
      await query(
        `INSERT INTO system_logs (log_type, message, metadata) VALUES ($1, $2, $3)`,
        [eventType, message, JSON.stringify(metadata)]
      );
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(limit = 100, logType = null) {
    try {
      let queryText = `
        SELECT log_type, message, metadata, created_at
        FROM system_logs
      `;
      const params = [];

      if (logType) {
        queryText += ` WHERE log_type = $1`;
        params.push(logType);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryText, params);
      return result.rows;

    } catch (error) {
      console.error('Failed to get system logs:', error);
      return [];
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      // Test basic connectivity
      await query('SELECT 1');

      // Check if materialized views exist and are not empty
      const marketStatsCount = await query('SELECT COUNT(*) FROM market_stats_by_zip');
      const analyticsCount = await query('SELECT COUNT(*) FROM property_analytics_cache');

      // Check for recent data
      const recentProperties = await query(`
        SELECT COUNT(*) FROM properties 
        WHERE created_at > NOW() - INTERVAL '7 days' AND is_active = true
      `);

      // Check cache service
      const cacheStats = await cacheService.getStats();

      return {
        database: {
          connected: true,
          marketStatsCount: parseInt(marketStatsCount.rows[0].count),
          analyticsCount: parseInt(analyticsCount.rows[0].count),
          recentProperties: parseInt(recentProperties.rows[0].count)
        },
        cache: cacheStats,
        timestamp: new Date().toISOString(),
        healthy: true
      };

    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        database: {
          connected: false,
          error: error.message
        },
        cache: { connected: false },
        timestamp: new Date().toISOString(),
        healthy: false
      };
    }
  }
}

// Create singleton instance
const dbOptimizationService = new DatabaseOptimizationService();

module.exports = dbOptimizationService;
