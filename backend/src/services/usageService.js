const { query } = require('../config/database');

const usageService = {
  /**
   * Track usage for a user action
   */
  async trackUsage(userId, actionType, quantity = 1, metadata = {}) {
    try {
      await query(
        `INSERT INTO usage_records (user_id, action_type, quantity, metadata)
         VALUES ($1, $2, $3, $4)`,
        [userId, actionType, quantity, JSON.stringify(metadata)]
      );
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  },

  /**
   * Get usage statistics for a user
   */
  async getUserUsage(userId, startDate = null, endDate = null) {
    try {
      let dateFilter = '';
      const params = [userId];

      if (startDate && endDate) {
        dateFilter = 'AND created_at BETWEEN $2 AND $3';
        params.push(startDate, endDate);
      } else if (startDate) {
        dateFilter = 'AND created_at >= $2';
        params.push(startDate);
      }

      const result = await query(
        `SELECT 
           action_type,
           SUM(quantity) as total_usage,
           COUNT(*) as action_count,
           MIN(created_at) as first_usage,
           MAX(created_at) as last_usage
         FROM usage_records 
         WHERE user_id = $1 ${dateFilter}
         GROUP BY action_type
         ORDER BY total_usage DESC`,
        params
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting user usage:', error);
      return [];
    }
  },

  /**
   * Get current month usage for a user
   */
  async getCurrentMonthUsage(userId) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      return await this.getUserUsage(userId, startOfMonth, endOfMonth);
    } catch (error) {
      console.error('Error getting current month usage:', error);
      return [];
    }
  },

  /**
   * Check if user has exceeded usage limits
   */
  async checkUsageLimit(userId, actionType, limit) {
    try {
      const currentUsage = await this.getCurrentMonthUsage(userId);
      const actionUsage = currentUsage.find(u => u.action_type === actionType);
      
      if (!actionUsage) {
        return { allowed: true, used: 0, limit };
      }

      const used = parseInt(actionUsage.total_usage);
      const allowed = used < limit;

      return { allowed, used, limit };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: true, used: 0, limit }; // Allow on error
    }
  },

  /**
   * Get user's subscription plan and limits
   */
  async getUserPlanLimits(userId) {
    try {
      const result = await query(
        `SELECT 
           u.subscription_plan,
           u.subscription_status,
           s.status as stripe_status
         FROM users u
         LEFT JOIN subscriptions s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getFreePlanLimits();
      }

      const user = result.rows[0];
      const plan = user.subscription_plan || 'free';
      const isActive = user.subscription_status === 'active' || 
                      user.stripe_status === 'active';

      return this.getPlanLimits(isActive ? plan : 'free');
    } catch (error) {
      console.error('Error getting user plan limits:', error);
      return this.getFreePlanLimits();
    }
  },

  /**
   * Get plan limits configuration
   */
  getPlanLimits(plan) {
    const limits = {
      free: {
        property_search: 10,
        export_csv: 2,
        export_pdf: 1,
        saved_searches: 3,
        api_calls: 100
      },
      pro: {
        property_search: -1, // unlimited
        export_csv: -1,
        export_pdf: -1,
        saved_searches: -1,
        api_calls: 10000
      },
      enterprise: {
        property_search: -1,
        export_csv: -1,
        export_pdf: -1,
        saved_searches: -1,
        api_calls: -1 // unlimited
      }
    };

    return limits[plan] || limits.free;
  },

  /**
   * Get free plan limits
   */
  getFreePlanLimits() {
    return this.getPlanLimits('free');
  },

  /**
   * Middleware to check usage limits before action
   */
  checkLimitMiddleware(actionType) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return next(); // Skip for unauthenticated requests
        }

        const userId = req.user.userId;
        const limits = await this.getUserPlanLimits(userId);
        const actionLimit = limits[actionType];

        // If unlimited (-1), allow
        if (actionLimit === -1) {
          return next();
        }

        const usageCheck = await this.checkUsageLimit(userId, actionType, actionLimit);

        if (!usageCheck.allowed) {
          return res.status(429).json({
            error: 'Usage Limit Exceeded',
            message: `You have reached your monthly limit of ${actionLimit} ${actionType} actions.`,
            used: usageCheck.used,
            limit: usageCheck.limit,
            upgradeUrl: '/pricing'
          });
        }

        // Add usage info to request for tracking after successful action
        req.usageTracking = {
          userId,
          actionType,
          limits,
          currentUsage: usageCheck
        };

        next();
      } catch (error) {
        console.error('Usage limit middleware error:', error);
        next(); // Continue on error
      }
    };
  },

  /**
   * Middleware to track usage after successful action
   */
  trackUsageMiddleware(actionType, getMetadata = null) {
    return async (req, res, next) => {
      // Store original json method
      const originalJson = res.json;

      // Override json method to track usage on successful response
      res.json = function(data) {
        // Only track on successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (req.usageTracking) {
            const metadata = getMetadata ? getMetadata(req, data) : {};
            usageService.trackUsage(
              req.usageTracking.userId,
              actionType,
              1,
              metadata
            );
          }
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    };
  }
};

module.exports = usageService;
