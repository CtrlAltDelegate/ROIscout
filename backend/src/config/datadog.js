const tracer = require('dd-trace');
const StatsD = require('hot-shots');

/**
 * DataDog configuration and initialization
 */
class DataDogService {
  constructor() {
    this.statsD = null;
    this.tracer = null;
    this.isEnabled = process.env.DATADOG_ENABLED === 'true';
    
    if (this.isEnabled) {
      this.initialize();
    }
  }

  initialize() {
    try {
      // Initialize DataDog tracer
      this.tracer = tracer.init({
        service: 'roiscout-backend',
        env: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        hostname: process.env.DATADOG_AGENT_HOST || 'localhost',
        port: process.env.DATADOG_AGENT_PORT || 8126,
        
        // Sampling configuration
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // Enable runtime metrics
        runtimeMetrics: true,
        
        // Enable profiling
        profiling: process.env.NODE_ENV === 'production',
        
        // Tags
        tags: {
          service: 'roiscout-backend',
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0'
        }
      });

      // Initialize StatsD client
      this.statsD = new StatsD({
        host: process.env.DATADOG_AGENT_HOST || 'localhost',
        port: process.env.DATADOG_STATSD_PORT || 8125,
        prefix: 'roiscout.backend.',
        globalTags: [
          `env:${process.env.NODE_ENV || 'development'}`,
          `service:roiscout-backend`,
          `version:${process.env.npm_package_version || '1.0.0'}`
        ]
      });

      console.log('✅ DataDog monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize DataDog:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Increment a counter metric
   */
  increment(metric, value = 1, tags = []) {
    if (!this.isEnabled || !this.statsD) return;
    
    try {
      this.statsD.increment(metric, value, tags);
    } catch (error) {
      console.error('DataDog increment error:', error);
    }
  }

  /**
   * Record a gauge metric
   */
  gauge(metric, value, tags = []) {
    if (!this.isEnabled || !this.statsD) return;
    
    try {
      this.statsD.gauge(metric, value, tags);
    } catch (error) {
      console.error('DataDog gauge error:', error);
    }
  }

  /**
   * Record a histogram metric
   */
  histogram(metric, value, tags = []) {
    if (!this.isEnabled || !this.statsD) return;
    
    try {
      this.statsD.histogram(metric, value, tags);
    } catch (error) {
      console.error('DataDog histogram error:', error);
    }
  }

  /**
   * Record timing information
   */
  timing(metric, duration, tags = []) {
    if (!this.isEnabled || !this.statsD) return;
    
    try {
      this.statsD.timing(metric, duration, tags);
    } catch (error) {
      console.error('DataDog timing error:', error);
    }
  }

  /**
   * Create a timer for measuring execution time
   */
  createTimer(metric, tags = []) {
    const startTime = Date.now();
    
    return {
      finish: () => {
        const duration = Date.now() - startTime;
        this.timing(metric, duration, tags);
        return duration;
      }
    };
  }

  /**
   * Express middleware for request monitoring
   */
  requestMiddleware() {
    return (req, res, next) => {
      if (!this.isEnabled) return next();

      const startTime = Date.now();
      const timer = this.createTimer('request.duration', [
        `method:${req.method}`,
        `route:${req.route?.path || req.path}`
      ]);

      // Increment request counter
      this.increment('request.count', 1, [
        `method:${req.method}`,
        `route:${req.route?.path || req.path}`
      ]);

      // Monitor response
      res.on('finish', () => {
        const duration = timer.finish();
        const statusCode = res.statusCode;
        
        // Record response metrics
        this.increment('response.count', 1, [
          `method:${req.method}`,
          `route:${req.route?.path || req.path}`,
          `status_code:${statusCode}`,
          `status_class:${Math.floor(statusCode / 100)}xx`
        ]);

        // Record response time
        this.histogram('response.time', duration, [
          `method:${req.method}`,
          `route:${req.route?.path || req.path}`,
          `status_code:${statusCode}`
        ]);

        // Track error rates
        if (statusCode >= 400) {
          this.increment('response.error', 1, [
            `method:${req.method}`,
            `route:${req.route?.path || req.path}`,
            `status_code:${statusCode}`
          ]);
        }
      });

      next();
    };
  }

  /**
   * Database query monitoring
   */
  trackDatabaseQuery(query, duration, success = true) {
    if (!this.isEnabled) return;

    const queryType = this.getQueryType(query);
    
    this.increment('database.query.count', 1, [
      `query_type:${queryType}`,
      `success:${success}`
    ]);

    this.histogram('database.query.duration', duration, [
      `query_type:${queryType}`,
      `success:${success}`
    ]);

    if (!success) {
      this.increment('database.query.error', 1, [
        `query_type:${queryType}`
      ]);
    }
  }

  /**
   * Cache operation monitoring
   */
  trackCacheOperation(operation, hit = false, duration = 0) {
    if (!this.isEnabled) return;

    this.increment('cache.operation.count', 1, [
      `operation:${operation}`,
      `hit:${hit}`
    ]);

    if (duration > 0) {
      this.histogram('cache.operation.duration', duration, [
        `operation:${operation}`
      ]);
    }

    if (operation === 'get') {
      this.increment(hit ? 'cache.hit' : 'cache.miss', 1);
    }
  }

  /**
   * Business metrics tracking
   */
  trackBusinessMetric(metric, value, tags = []) {
    if (!this.isEnabled) return;

    this.gauge(`business.${metric}`, value, tags);
  }

  /**
   * User activity tracking
   */
  trackUserActivity(userId, action, metadata = {}) {
    if (!this.isEnabled) return;

    this.increment('user.activity', 1, [
      `action:${action}`,
      `user_id:${userId}`
    ]);

    // Track specific business events
    switch (action) {
      case 'property_search':
        this.increment('business.property_searches', 1);
        break;
      case 'property_view':
        this.increment('business.property_views', 1);
        break;
      case 'export_data':
        this.increment('business.data_exports', 1);
        break;
      case 'alert_created':
        this.increment('business.alerts_created', 1);
        break;
    }
  }

  /**
   * API usage tracking
   */
  trackApiUsage(endpoint, userId, planType = 'free') {
    if (!this.isEnabled) return;

    this.increment('api.usage', 1, [
      `endpoint:${endpoint}`,
      `plan:${planType}`,
      `user_id:${userId}`
    ]);

    // Track usage by plan type
    this.increment(`api.usage.${planType}`, 1, [
      `endpoint:${endpoint}`
    ]);
  }

  /**
   * System health metrics
   */
  trackSystemHealth() {
    if (!this.isEnabled) return;

    // Memory usage
    const memUsage = process.memoryUsage();
    this.gauge('system.memory.heap_used', memUsage.heapUsed);
    this.gauge('system.memory.heap_total', memUsage.heapTotal);
    this.gauge('system.memory.external', memUsage.external);

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    this.gauge('system.cpu.user', cpuUsage.user);
    this.gauge('system.cpu.system', cpuUsage.system);

    // Uptime
    this.gauge('system.uptime', process.uptime());
  }

  /**
   * Extract query type from SQL
   */
  getQueryType(query) {
    if (!query || typeof query !== 'string') return 'unknown';
    
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery.startsWith('select')) return 'select';
    if (normalizedQuery.startsWith('insert')) return 'insert';
    if (normalizedQuery.startsWith('update')) return 'update';
    if (normalizedQuery.startsWith('delete')) return 'delete';
    if (normalizedQuery.startsWith('create')) return 'create';
    if (normalizedQuery.startsWith('alter')) return 'alter';
    if (normalizedQuery.startsWith('drop')) return 'drop';
    
    return 'other';
  }

  /**
   * Start periodic system health monitoring
   */
  startHealthMonitoring() {
    if (!this.isEnabled) return;

    // Track system health every 30 seconds
    setInterval(() => {
      this.trackSystemHealth();
    }, 30000);

    console.log('✅ DataDog health monitoring started');
  }

  /**
   * Custom event tracking
   */
  event(title, text, tags = [], alertType = 'info') {
    if (!this.isEnabled || !this.statsD) return;

    try {
      this.statsD.event(title, text, {
        alert_type: alertType,
        tags: tags
      });
    } catch (error) {
      console.error('DataDog event error:', error);
    }
  }

  /**
   * Service check
   */
  serviceCheck(name, status, tags = [], message = '') {
    if (!this.isEnabled || !this.statsD) return;

    try {
      this.statsD.check(name, status, {
        tags: tags,
        message: message
      });
    } catch (error) {
      console.error('DataDog service check error:', error);
    }
  }
}

// Create singleton instance
const dataDogService = new DataDogService();

module.exports = dataDogService;
