const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    this.init();
  }

  async init() {
    try {
      // Create Redis client
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis connection refused, retrying...');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.log('⚠️ Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.log('⚠️ Redis connection failed, caching disabled:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key, ttl) {
    if (!this.isConnected) return false;

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys
   */
  async mget(keys) {
    if (!this.isConnected || keys.length === 0) return [];

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return [];
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    if (!this.isConnected || keyValuePairs.length === 0) return false;

    try {
      const pipeline = this.client.multi();
      
      for (const [key, value] of keyValuePairs) {
        const serialized = JSON.stringify(value);
        pipeline.setEx(key, ttl, serialized);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Generate cache key for property searches
   */
  generatePropertySearchKey(filters) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          result[key] = filters[key];
        }
        return result;
      }, {});
    
    const filterString = JSON.stringify(sortedFilters);
    const hash = require('crypto').createHash('md5').update(filterString).digest('hex');
    return `property_search:${hash}`;
  }

  /**
   * Generate cache key for analytics data
   */
  generateAnalyticsKey(type, params = {}) {
    const paramString = JSON.stringify(params);
    const hash = require('crypto').createHash('md5').update(paramString).digest('hex');
    return `analytics:${type}:${hash}`;
  }

  /**
   * Generate cache key for user data
   */
  generateUserKey(userId, dataType) {
    return `user:${userId}:${dataType}`;
  }

  /**
   * Cache middleware for Express routes
   */
  middleware(keyGenerator, ttl = this.defaultTTL) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      try {
        const cacheKey = typeof keyGenerator === 'function' 
          ? keyGenerator(req) 
          : keyGenerator;

        const cachedData = await this.get(cacheKey);
        
        if (cachedData) {
          console.log(`Cache hit: ${cacheKey}`);
          return res.json(cachedData);
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to cache response
        res.json = (data) => {
          // Cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.set(cacheKey, data, ttl).catch(err => {
              console.error('Failed to cache response:', err);
            });
            console.log(`Cache set: ${cacheKey}`);
          }

          // Call original json method
          return originalJson.call(res, data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Invalidate cache for property-related data
   */
  async invalidatePropertyCache() {
    try {
      await this.delPattern('property_search:*');
      await this.delPattern('analytics:*');
      console.log('Property cache invalidated');
    } catch (error) {
      console.error('Failed to invalidate property cache:', error);
    }
  }

  /**
   * Invalidate cache for user-specific data
   */
  async invalidateUserCache(userId) {
    try {
      await this.delPattern(`user:${userId}:*`);
      console.log(`User cache invalidated for user ${userId}`);
    } catch (error) {
      console.error('Failed to invalidate user cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
