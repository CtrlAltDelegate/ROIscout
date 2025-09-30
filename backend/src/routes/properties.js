const express = require('express');
const { query } = require('../config/database');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const dataDogService = require('../config/datadog');
const { validateQueryParams } = require('../middleware/queryOptimization');

const router = express.Router();

// Apply monitoring middleware
router.use(dataDogService.requestMiddleware());
router.use(validateQueryParams);

/**
 * GET /api/properties - Search properties with advanced filtering
 */
router.get('/', 
  optionalAuth,
  cacheService.middleware(
    (req) => `properties:search:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`,
    5 * 60 // 5 minutes
  ),
  async (req, res) => {
    const timer = dataDogService.createTimer('properties.search');
    
    try {
      const {
        zipCode,
        city,
        state,
        minPrice,
        maxPrice,
        minRatio,
        maxRatio,
        bedrooms,
        bathrooms,
        propertyType,
        minSquareFeet,
        maxSquareFeet,
        sortBy = 'price_to_rent_ratio',
        sortOrder = 'desc',
        limit = 50,
        offset = 0
      } = req.query;

      // Build dynamic query
      let whereConditions = ['is_active = true'];
      let queryParams = [];
      let paramIndex = 1;

      // Location filters
      if (zipCode) {
        const zipCodes = zipCode.split(',').map(z => z.trim());
        whereConditions.push(`zip_code = ANY($${paramIndex})`);
        queryParams.push(zipCodes);
        paramIndex++;
      }

      if (city) {
        whereConditions.push(`LOWER(city) = LOWER($${paramIndex})`);
        queryParams.push(city);
        paramIndex++;
      }

      if (state) {
        whereConditions.push(`LOWER(state) = LOWER($${paramIndex})`);
        queryParams.push(state);
        paramIndex++;
      }

      // Price filters
      if (minPrice) {
        whereConditions.push(`list_price >= $${paramIndex}`);
        queryParams.push(parseInt(minPrice));
        paramIndex++;
      }

      if (maxPrice) {
        whereConditions.push(`list_price <= $${paramIndex}`);
        queryParams.push(parseInt(maxPrice));
        paramIndex++;
      }

      // ROI filters
      if (minRatio) {
        whereConditions.push(`price_to_rent_ratio >= $${paramIndex}`);
        queryParams.push(parseFloat(minRatio));
        paramIndex++;
      }

      if (maxRatio) {
        whereConditions.push(`price_to_rent_ratio <= $${paramIndex}`);
        queryParams.push(parseFloat(maxRatio));
        paramIndex++;
      }

      // Property characteristics
      if (bedrooms) {
        whereConditions.push(`bedrooms >= $${paramIndex}`);
        queryParams.push(parseInt(bedrooms));
        paramIndex++;
      }

      if (bathrooms) {
        whereConditions.push(`bathrooms >= $${paramIndex}`);
        queryParams.push(parseFloat(bathrooms));
        paramIndex++;
      }

      if (propertyType && propertyType !== 'Any') {
        whereConditions.push(`property_type = $${paramIndex}`);
        queryParams.push(propertyType);
        paramIndex++;
      }

      if (minSquareFeet) {
        whereConditions.push(`square_feet >= $${paramIndex}`);
        queryParams.push(parseInt(minSquareFeet));
        paramIndex++;
      }

      if (maxSquareFeet) {
        whereConditions.push(`square_feet <= $${paramIndex}`);
        queryParams.push(parseInt(maxSquareFeet));
        paramIndex++;
      }

      // Validate sort parameters
      const allowedSortFields = [
        'list_price', 'price_to_rent_ratio', 'cap_rate', 'created_at',
        'bedrooms', 'bathrooms', 'square_feet', 'city', 'state'
      ];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'price_to_rent_ratio';
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Add pagination parameters
      queryParams.push(Math.min(parseInt(limit), 100)); // Max 100 results
      const limitParam = paramIndex++;
      queryParams.push(Math.max(parseInt(offset), 0));
      const offsetParam = paramIndex++;

      // Build final query
      const searchQuery = `
        SELECT 
          id,
          address,
          city,
          state,
          zip_code,
          latitude,
          longitude,
          list_price,
          estimated_rent,
          price_to_rent_ratio,
          cap_rate,
          bedrooms,
          bathrooms,
          square_feet,
          property_type,
          data_source,
          last_updated,
          created_at,
          (price_to_rent_ratio > 6.0) as is_exceptional_deal
        FROM properties 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM properties 
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [propertiesResult, countResult] = await Promise.all([
        query(searchQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const properties = propertiesResult.rows;
      const total = parseInt(countResult.rows[0].total);

      // Track business metrics
      dataDogService.trackUserActivity(
        req.user?.id || 'anonymous',
        'property_search',
        { filters: Object.keys(req.query).length, results: properties.length }
      );

      timer.finish();

      res.json({
        properties,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        filters: req.query,
        meta: {
          searchTime: Date.now() - timer.startTime,
          cached: false
        }
      });

    } catch (error) {
      timer.finish();
      dataDogService.increment('properties.search.error');
      console.error('Property search error:', error);
      res.status(500).json({
        error: 'Search failed',
        message: 'Unable to search properties at this time'
      });
    }
  }
);

/**
 * GET /api/properties/:id - Get single property details
 */
router.get('/:id',
  optionalAuth,
  cacheService.middleware(
    (req) => `property:${req.params.id}:${req.user?.id || 'anonymous'}`,
    10 * 60 // 10 minutes
  ),
  async (req, res) => {
    const timer = dataDogService.createTimer('properties.get_by_id');
    
    try {
      const { id } = req.params;

      const propertyQuery = `
        SELECT 
          p.*,
          (p.price_to_rent_ratio > 6.0) as is_exceptional_deal,
          (
            SELECT AVG(price_to_rent_ratio) 
            FROM properties 
            WHERE city = p.city AND state = p.state AND is_active = true
          ) as market_avg_ratio,
          (
            SELECT COUNT(*) 
            FROM properties 
            WHERE zip_code = p.zip_code AND is_active = true
          ) as zip_property_count
        FROM properties p
        WHERE p.id = $1 AND p.is_active = true
      `;

      const result = await query(propertyQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Property not found',
          message: 'The requested property does not exist or is no longer available'
        });
      }

      const property = result.rows[0];

      // Get comparable properties
      const comparablesQuery = `
        SELECT 
          id, address, city, state, zip_code,
          list_price, estimated_rent, price_to_rent_ratio,
          bedrooms, bathrooms, square_feet, property_type
        FROM properties
        WHERE city = $1 AND state = $2 
          AND property_type = $3
          AND bedrooms = $4
          AND is_active = true
          AND id != $5
        ORDER BY ABS(list_price - $6)
        LIMIT 5
      `;

      const comparablesResult = await query(comparablesQuery, [
        property.city,
        property.state,
        property.property_type,
        property.bedrooms,
        property.list_price,
        id
      ]);

      // Track property view
      dataDogService.trackUserActivity(
        req.user?.id || 'anonymous',
        'property_view',
        { property_id: id, city: property.city, state: property.state }
      );

      timer.finish();

      res.json({
        property,
        comparables: comparablesResult.rows,
        meta: {
          viewTime: new Date().toISOString(),
          cached: false
        }
      });

    } catch (error) {
      timer.finish();
      dataDogService.increment('properties.get_by_id.error');
      console.error('Property fetch error:', error);
      res.status(500).json({
        error: 'Property fetch failed',
        message: 'Unable to retrieve property details'
      });
    }
  }
);

/**
 * GET /api/properties/market/:state/:city - Get market statistics
 */
router.get('/market/:state/:city',
  optionalAuth,
  cacheService.middleware(
    (req) => `market:${req.params.state}:${req.params.city}`,
    30 * 60 // 30 minutes
  ),
  async (req, res) => {
    const timer = dataDogService.createTimer('properties.market_stats');
    
    try {
      const { state, city } = req.params;

      const marketStatsQuery = `
        SELECT 
          COUNT(*) as total_properties,
          AVG(list_price) as avg_price,
          AVG(estimated_rent) as avg_rent,
          AVG(price_to_rent_ratio) as avg_ratio,
          MIN(price_to_rent_ratio) as min_ratio,
          MAX(price_to_rent_ratio) as max_ratio,
          COUNT(*) FILTER (WHERE price_to_rent_ratio > 6.0) as exceptional_deals,
          AVG(square_feet) as avg_square_feet,
          MODE() WITHIN GROUP (ORDER BY property_type) as most_common_type
        FROM properties
        WHERE LOWER(city) = LOWER($1) 
          AND LOWER(state) = LOWER($2)
          AND is_active = true
      `;

      const priceDistributionQuery = `
        SELECT 
          CASE 
            WHEN list_price < 100000 THEN 'Under $100K'
            WHEN list_price < 200000 THEN '$100K-$200K'
            WHEN list_price < 300000 THEN '$200K-$300K'
            WHEN list_price < 500000 THEN '$300K-$500K'
            ELSE 'Over $500K'
          END as price_range,
          COUNT(*) as count,
          AVG(price_to_rent_ratio) as avg_ratio
        FROM properties
        WHERE LOWER(city) = LOWER($1) 
          AND LOWER(state) = LOWER($2)
          AND is_active = true
        GROUP BY price_range
        ORDER BY MIN(list_price)
      `;

      const [statsResult, distributionResult] = await Promise.all([
        query(marketStatsQuery, [city, state]),
        query(priceDistributionQuery, [city, state])
      ]);

      if (statsResult.rows.length === 0 || statsResult.rows[0].total_properties === '0') {
        return res.status(404).json({
          error: 'Market not found',
          message: 'No properties found for this market'
        });
      }

      const stats = statsResult.rows[0];
      const distribution = distributionResult.rows;

      timer.finish();

      res.json({
        market: {
          city,
          state,
          displayName: `${city}, ${state}`
        },
        statistics: {
          totalProperties: parseInt(stats.total_properties),
          averagePrice: Math.round(parseFloat(stats.avg_price)),
          averageRent: Math.round(parseFloat(stats.avg_rent)),
          averageRatio: parseFloat(stats.avg_ratio).toFixed(1),
          minRatio: parseFloat(stats.min_ratio).toFixed(1),
          maxRatio: parseFloat(stats.max_ratio).toFixed(1),
          exceptionalDeals: parseInt(stats.exceptional_deals),
          averageSquareFeet: Math.round(parseFloat(stats.avg_square_feet)),
          mostCommonType: stats.most_common_type
        },
        priceDistribution: distribution.map(d => ({
          range: d.price_range,
          count: parseInt(d.count),
          averageRatio: parseFloat(d.avg_ratio).toFixed(1)
        })),
        meta: {
          generatedAt: new Date().toISOString(),
          cached: false
        }
      });

    } catch (error) {
      timer.finish();
      dataDogService.increment('properties.market_stats.error');
      console.error('Market stats error:', error);
      res.status(500).json({
        error: 'Market analysis failed',
        message: 'Unable to generate market statistics'
      });
    }
  }
);

/**
 * POST /api/properties/:id/favorite - Add property to favorites
 */
router.post('/:id/favorite',
  requireAuth,
  async (req, res) => {
    const timer = dataDogService.createTimer('properties.add_favorite');
    
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if property exists
      const propertyCheck = await query(
        'SELECT id FROM properties WHERE id = $1 AND is_active = true',
        [id]
      );

      if (propertyCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Property not found',
          message: 'The requested property does not exist'
        });
      }

      // Add to favorites (upsert)
      await query(`
        INSERT INTO user_favorites (user_id, property_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, property_id) DO NOTHING
      `, [userId, id]);

      dataDogService.trackUserActivity(userId, 'property_favorited', { property_id: id });
      timer.finish();

      res.json({
        success: true,
        message: 'Property added to favorites'
      });

    } catch (error) {
      timer.finish();
      dataDogService.increment('properties.add_favorite.error');
      console.error('Add favorite error:', error);
      res.status(500).json({
        error: 'Failed to add favorite',
        message: 'Unable to add property to favorites'
      });
    }
  }
);

/**
 * DELETE /api/properties/:id/favorite - Remove property from favorites
 */
router.delete('/:id/favorite',
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND property_id = $2',
        [userId, id]
      );

      dataDogService.trackUserActivity(userId, 'property_unfavorited', { property_id: id });

      res.json({
        success: true,
        message: 'Property removed from favorites'
      });

    } catch (error) {
      dataDogService.increment('properties.remove_favorite.error');
      console.error('Remove favorite error:', error);
      res.status(500).json({
        error: 'Failed to remove favorite',
        message: 'Unable to remove property from favorites'
      });
    }
  }
);

/**
 * GET /api/properties/favorites - Get user's favorite properties
 */
router.get('/user/favorites',
  requireAuth,
  cacheService.middleware(
    (req) => `user:${req.user.id}:favorites`,
    2 * 60 // 2 minutes
  ),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const favoritesQuery = `
        SELECT 
          p.*,
          uf.created_at as favorited_at,
          (p.price_to_rent_ratio > 6.0) as is_exceptional_deal
        FROM user_favorites uf
        JOIN properties p ON uf.property_id = p.id
        WHERE uf.user_id = $1 AND p.is_active = true
        ORDER BY uf.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_favorites uf
        JOIN properties p ON uf.property_id = p.id
        WHERE uf.user_id = $1 AND p.is_active = true
      `;

      const [favoritesResult, countResult] = await Promise.all([
        query(favoritesQuery, [userId, parseInt(limit), parseInt(offset)]),
        query(countQuery, [userId])
      ]);

      res.json({
        favorites: favoritesResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      dataDogService.increment('properties.get_favorites.error');
      console.error('Get favorites error:', error);
      res.status(500).json({
        error: 'Failed to get favorites',
        message: 'Unable to retrieve favorite properties'
      });
    }
  }
);

module.exports = router;
