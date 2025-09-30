const { captureMessage } = require('../config/sentry');

/**
 * Middleware to optimize and monitor database queries
 */
class QueryOptimizationMiddleware {
  constructor() {
    this.slowQueryThreshold = 2000; // 2 seconds
    this.queryStats = new Map();
  }

  /**
   * Middleware to track query performance
   */
  trackQueryPerformance() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Store original query method
      const originalQuery = req.db?.query;
      
      if (originalQuery) {
        req.db.query = async (...args) => {
          const queryStart = Date.now();
          
          try {
            const result = await originalQuery.apply(req.db, args);
            const queryTime = Date.now() - queryStart;
            
            // Log slow queries
            if (queryTime > this.slowQueryThreshold) {
              captureMessage(`Slow query detected: ${queryTime}ms`, 'warning', {
                query: args[0],
                queryTime,
                endpoint: req.path,
                method: req.method
              });
            }
            
            // Update query statistics
            this.updateQueryStats(args[0], queryTime);
            
            return result;
          } catch (error) {
            const queryTime = Date.now() - queryStart;
            
            // Log query errors
            captureMessage(`Query error: ${error.message}`, 'error', {
              query: args[0],
              queryTime,
              endpoint: req.path,
              method: req.method,
              error: error.message
            });
            
            throw error;
          }
        };
      }
      
      // Track overall request time
      res.on('finish', () => {
        const totalTime = Date.now() - startTime;
        
        if (totalTime > 5000) { // 5 seconds
          captureMessage(`Slow request detected: ${totalTime}ms`, 'warning', {
            endpoint: req.path,
            method: req.method,
            totalTime,
            statusCode: res.statusCode
          });
        }
      });
      
      next();
    };
  }

  /**
   * Update query statistics
   */
  updateQueryStats(query, executionTime) {
    const queryKey = this.normalizeQuery(query);
    
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }
    
    const stats = this.queryStats.get(queryKey);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.minTime = Math.min(stats.minTime, executionTime);
  }

  /**
   * Normalize query for statistics (remove parameters)
   */
  normalizeQuery(query) {
    if (typeof query !== 'string') return 'unknown';
    
    return query
      .replace(/\$\d+/g, '?') // Replace $1, $2, etc. with ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    const stats = Array.from(this.queryStats.entries()).map(([query, stats]) => ({
      query,
      ...stats
    }));
    
    return stats.sort((a, b) => b.avgTime - a.avgTime);
  }

  /**
   * Clear query statistics
   */
  clearStats() {
    this.queryStats.clear();
  }

  /**
   * Middleware to add query hints for optimization
   */
  addQueryHints() {
    return (req, res, next) => {
      // Add common query optimization hints
      req.queryHints = {
        // Use indexes for common filter patterns
        useIndex: (tableName, columns) => {
          return `/*+ INDEX(${tableName}, idx_${columns.join('_')}) */`;
        },
        
        // Limit result sets
        limitResults: (limit = 1000) => {
          return `LIMIT ${Math.min(limit, 1000)}`;
        },
        
        // Use materialized views when available
        useMaterializedView: (viewName) => {
          return `/* Use materialized view: ${viewName} */`;
        }
      };
      
      next();
    };
  }

  /**
   * Middleware to validate query parameters
   */
  validateQueryParams() {
    return (req, res, next) => {
      // Validate common parameters
      if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit < 1 || limit > 1000) {
          return res.status(400).json({
            error: 'Invalid limit parameter',
            message: 'Limit must be between 1 and 1000'
          });
        }
        req.query.limit = limit;
      }
      
      if (req.query.offset) {
        const offset = parseInt(req.query.offset);
        if (isNaN(offset) || offset < 0) {
          return res.status(400).json({
            error: 'Invalid offset parameter',
            message: 'Offset must be a non-negative number'
          });
        }
        req.query.offset = offset;
      }
      
      // Validate price ranges
      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice);
        if (isNaN(minPrice) || minPrice < 0) {
          return res.status(400).json({
            error: 'Invalid minPrice parameter',
            message: 'minPrice must be a positive number'
          });
        }
        req.query.minPrice = minPrice;
      }
      
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice);
        if (isNaN(maxPrice) || maxPrice < 0) {
          return res.status(400).json({
            error: 'Invalid maxPrice parameter',
            message: 'maxPrice must be a positive number'
          });
        }
        req.query.maxPrice = maxPrice;
      }
      
      next();
    };
  }
}

// Create singleton instance
const queryOptimization = new QueryOptimizationMiddleware();

module.exports = {
  trackQueryPerformance: queryOptimization.trackQueryPerformance.bind(queryOptimization),
  addQueryHints: queryOptimization.addQueryHints.bind(queryOptimization),
  validateQueryParams: queryOptimization.validateQueryParams.bind(queryOptimization),
  getQueryStats: queryOptimization.getQueryStats.bind(queryOptimization),
  clearStats: queryOptimization.clearStats.bind(queryOptimization)
};
