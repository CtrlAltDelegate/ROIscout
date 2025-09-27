// ROIscout Analytics API Server
// Main Express server with property analytics endpoints

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');
require('dotenv').config();

class AnalyticsServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Database connection
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    
    setupMiddleware() {
        // Security and performance
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(morgan('combined'));
        
        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3001',
            credentials: true
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
        
        // API routes
        this.app.use('/api/properties', this.createPropertyRoutes());
        this.app.use('/api/analytics', this.createAnalyticsRoutes());
        this.app.use('/api/map', this.createMapRoutes());
        this.app.use('/api/export', this.createExportRoutes());
    }
    
    createPropertyRoutes() {
        const router = express.Router();
        
        // GET /api/properties - Search properties with filters
        router.get('/', async (req, res) => {
            try {
                const {
                    zip_code,
                    city,
                    state,
                    min_price,
                    max_price,
                    min_rent,
                    max_rent,
                    min_ratio,
                    max_ratio,
                    bedrooms,
                    bathrooms,
                    property_type,
                    min_sqft,
                    max_sqft,
                    sort_by = 'price_to_rent_ratio',
                    sort_order = 'desc',
                    limit = 50,
                    offset = 0,
                    anomalies_only = false
                } = req.query;
                
                // Build dynamic query
                let query = `
                    SELECT 
                        id, external_id, address, city, state, zip_code,
                        property_type, bedrooms, bathrooms, square_feet,
                        list_price_dollars, estimated_rent_dollars,
                        price_to_rent_ratio, cap_rate, gross_rent_multiplier,
                        ratio_vs_market_percent, latitude, longitude,
                        data_source, last_updated
                    FROM property_analytics
                    WHERE 1=1
                `;
                
                const params = [];
                let paramCount = 0;
                
                // Add filters
                if (zip_code) {
                    query += ` AND zip_code = $${++paramCount}`;
                    params.push(zip_code);
                }
                
                if (city) {
                    query += ` AND LOWER(city) LIKE LOWER($${++paramCount})`;
                    params.push(`%${city}%`);
                }
                
                if (state) {
                    query += ` AND UPPER(state) = UPPER($${++paramCount})`;
                    params.push(state);
                }
                
                if (min_price) {
                    query += ` AND list_price_dollars >= $${++paramCount}`;
                    params.push(parseFloat(min_price));
                }
                
                if (max_price) {
                    query += ` AND list_price_dollars <= $${++paramCount}`;
                    params.push(parseFloat(max_price));
                }
                
                if (min_rent) {
                    query += ` AND estimated_rent_dollars >= $${++paramCount}`;
                    params.push(parseFloat(min_rent));
                }
                
                if (max_rent) {
                    query += ` AND estimated_rent_dollars <= $${++paramCount}`;
                    params.push(parseFloat(max_rent));
                }
                
                if (min_ratio) {
                    query += ` AND price_to_rent_ratio >= $${++paramCount}`;
                    params.push(parseFloat(min_ratio));
                }
                
                if (max_ratio) {
                    query += ` AND price_to_rent_ratio <= $${++paramCount}`;
                    params.push(parseFloat(max_ratio));
                }
                
                if (bedrooms) {
                    query += ` AND bedrooms = $${++paramCount}`;
                    params.push(parseInt(bedrooms));
                }
                
                if (bathrooms) {
                    query += ` AND bathrooms >= $${++paramCount}`;
                    params.push(parseFloat(bathrooms));
                }
                
                if (property_type) {
                    query += ` AND property_type = $${++paramCount}`;
                    params.push(property_type);
                }
                
                if (min_sqft) {
                    query += ` AND square_feet >= $${++paramCount}`;
                    params.push(parseInt(min_sqft));
                }
                
                if (max_sqft) {
                    query += ` AND square_feet <= $${++paramCount}`;
                    params.push(parseInt(max_sqft));
                }
                
                // Anomalies filter (properties significantly better than market)
                if (anomalies_only === 'true') {
                    query += ` AND ratio_vs_market_percent >= 10`;
                }
                
                // Sorting
                const validSortColumns = [
                    'list_price_dollars', 'estimated_rent_dollars', 'price_to_rent_ratio',
                    'cap_rate', 'square_feet', 'ratio_vs_market_percent', 'last_updated'
                ];
                
                if (validSortColumns.includes(sort_by)) {
                    const order = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
                    query += ` ORDER BY ${sort_by} ${order}`;
                } else {
                    query += ` ORDER BY price_to_rent_ratio DESC`;
                }
                
                // Pagination
                query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
                params.push(parseInt(limit), parseInt(offset));
                
                const result = await this.db.query(query, params);
                
                // Get total count for pagination
                let countQuery = query.split('ORDER BY')[0].replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM');
                const countParams = params.slice(0, -2); // Remove limit and offset
                const countResult = await this.db.query(countQuery, countParams);
                
                res.json({
                    properties: result.rows,
                    pagination: {
                        total: parseInt(countResult.rows[0].count),
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        has_more: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].count)
                    }
                });
                
            } catch (error) {
                console.error('Property search error:', error);
                res.status(500).json({ error: 'Failed to search properties' });
            }
        });
        
        // GET /api/properties/:id - Get single property details
        router.get('/:id', async (req, res) => {
            try {
                const { id } = req.params;
                
                const query = `
                    SELECT 
                        p.*,
                        pa.list_price_dollars,
                        pa.estimated_rent_dollars,
                        pa.price_to_rent_ratio,
                        pa.cap_rate,
                        pa.gross_rent_multiplier,
                        pa.ratio_vs_market_percent
                    FROM properties p
                    LEFT JOIN property_analytics pa ON p.id = pa.id
                    WHERE p.id = $1 AND p.is_active = true
                `;
                
                const result = await this.db.query(query, [id]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Property not found' });
                }
                
                // Get nearby comps
                const property = result.rows[0];
                const compsQuery = `
                    SELECT address, bedrooms, bathrooms, monthly_rent/100.0 as monthly_rent,
                           data_source, listing_date
                    FROM rental_comps
                    WHERE zip_code = $1 
                    AND bedrooms = $2
                    AND is_active = true
                    ORDER BY 
                        SQRT(
                            POWER(latitude - $3, 2) + 
                            POWER(longitude - $4, 2)
                        ) ASC
                    LIMIT 5
                `;
                
                const compsResult = await this.db.query(compsQuery, [
                    property.zip_code,
                    property.bedrooms,
                    property.latitude,
                    property.longitude
                ]);
                
                res.json({
                    property: result.rows[0],
                    nearby_comps: compsResult.rows
                });
                
            } catch (error) {
                console.error('Property detail error:', error);
                res.status(500).json({ error: 'Failed to get property details' });
            }
        });
        
        return router;
    }
    
    createAnalyticsRoutes() {
        const router = express.Router();
        
        // GET /api/analytics/market-summary - Market statistics
        router.get('/market-summary', async (req, res) => {
            try {
                const { zip_code, city, state } = req.query;
                
                let query = `
                    SELECT 
                        zip_code,
                        total_properties,
                        avg_price,
                        median_price,
                        avg_rent,
                        avg_ratio,
                        min_ratio,
                        max_ratio,
                        high_ratio_count
                    FROM market_summary
                    WHERE 1=1
                `;
                
                const params = [];
                let paramCount = 0;
                
                if (zip_code) {
                    query += ` AND zip_code = $${++paramCount}`;
                    params.push(zip_code);
                }
                
                if (state) {
                    query += ` AND zip_code IN (
                        SELECT DISTINCT zip_code FROM properties WHERE UPPER(state) = UPPER($${++paramCount})
                    )`;
                    params.push(state);
                }
                
                query += ` ORDER BY total_properties DESC LIMIT 20`;
                
                const result = await this.db.query(query, params);
                res.json({ markets: result.rows });
                
            } catch (error) {
                console.error('Market summary error:', error);
                res.status(500).json({ error: 'Failed to get market summary' });
            }
        });
        
        // GET /api/analytics/anomalies - Find exceptional deals
        router.get('/anomalies', async (req, res) => {
            try {
                const { 
                    min_improvement = 15, // Minimum % better than market
                    zip_code,
                    max_price,
                    limit = 25 
                } = req.query;
                
                let query = `
                    SELECT 
                        id, address, city, state, zip_code,
                        list_price_dollars, estimated_rent_dollars,
                        price_to_rent_ratio, ratio_vs_market_percent,
                        bedrooms, bathrooms, square_feet, data_source
                    FROM property_analytics
                    WHERE ratio_vs_market_percent >= $1
                    AND ratio_vs_market_percent IS NOT NULL
                `;
                
                const params = [parseFloat(min_improvement)];
                let paramCount = 1;
                
                if (zip_code) {
                    query += ` AND zip_code = $${++paramCount}`;
                    params.push(zip_code);
                }
                
                if (max_price) {
                    query += ` AND list_price_dollars <= $${++paramCount}`;
                    params.push(parseFloat(max_price));
                }
                
                query += ` ORDER BY ratio_vs_market_percent DESC LIMIT $${++paramCount}`;
                params.push(parseInt(limit));
                
                const result = await this.db.query(query, params);
                
                res.json({
                    anomalies: result.rows,
                    criteria: {
                        min_improvement_percent: parseFloat(min_improvement),
                        total_found: result.rows.length
                    }
                });
                
            } catch (error) {
                console.error('Anomalies error:', error);
                res.status(500).json({ error: 'Failed to find anomalies' });
            }
        });
        
        // GET /api/analytics/trends - Market trends and statistics
        router.get('/trends', async (req, res) => {
            try {
                const query = `
                    SELECT 
                        state,
                        COUNT(*) as property_count,
                        AVG(list_price_dollars) as avg_price,
                        AVG(estimated_rent_dollars) as avg_rent,
                        AVG(price_to_rent_ratio) as avg_ratio,
                        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_to_rent_ratio) as median_ratio
                    FROM property_analytics
                    GROUP BY state
                    HAVING COUNT(*) >= 5
                    ORDER BY avg_ratio DESC
                `;
                
                const result = await this.db.query(query);
                
                // Get property type breakdown
                const typeQuery = `
                    SELECT 
                        property_type,
                        COUNT(*) as count,
                        AVG(price_to_rent_ratio) as avg_ratio
                    FROM property_analytics
                    WHERE property_type IS NOT NULL
                    GROUP BY property_type
                    ORDER BY count DESC
                `;
                
                const typeResult = await this.db.query(typeQuery);
                
                res.json({
                    by_state: result.rows,
                    by_property_type: typeResult.rows,
                    generated_at: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('Trends error:', error);
                res.status(500).json({ error: 'Failed to get trends' });
            }
        });
        
        return router;
    }
    
    createMapRoutes() {
        const router = express.Router();
        
        // GET /api/map/heatmap - Property data for heatmap visualization
        router.get('/heatmap', async (req, res) => {
            try {
                const {
                    bounds, // format: "lat1,lng1,lat2,lng2"
                    zoom_level = 10,
                    min_ratio,
                    max_price
                } = req.query;
                
                let query = `
                    SELECT 
                        latitude, longitude, price_to_rent_ratio,
                        list_price_dollars, estimated_rent_dollars,
                        address, zip_code, id
                    FROM property_analytics
                    WHERE latitude IS NOT NULL 
                    AND longitude IS NOT NULL
                    AND price_to_rent_ratio IS NOT NULL
                `;
                
                const params = [];
                let paramCount = 0;
                
                // Geographic bounds filtering
                if (bounds) {
                    const [lat1, lng1, lat2, lng2] = bounds.split(',').map(parseFloat);
                    query += ` AND latitude BETWEEN $${++paramCount} AND $${++paramCount}`;
                    query += ` AND longitude BETWEEN $${++paramCount} AND $${++paramCount}`;
                    params.push(Math.min(lat1, lat2), Math.max(lat1, lat2), Math.min(lng1, lng2), Math.max(lng1, lng2));
                }
                
                if (min_ratio) {
                    query += ` AND price_to_rent_ratio >= $${++paramCount}`;
                    params.push(parseFloat(min_ratio));
                }
                
                if (max_price) {
                    query += ` AND list_price_dollars <= $${++paramCount}`;
                    params.push(parseFloat(max_price));
                }
                
                // Limit results based on zoom level for performance
                const limit = zoom_level > 12 ? 1000 : zoom_level > 8 ? 500 : 200;
                query += ` ORDER BY price_to_rent_ratio DESC LIMIT ${limit}`;
                
                const result = await this.db.query(query, params);
                
                res.json({
                    points: result.rows.map(row => ({
                        lat: parseFloat(row.latitude),
                        lng: parseFloat(row.longitude),
                        ratio: parseFloat(row.price_to_rent_ratio),
                        price: row.list_price_dollars,
                        rent: row.estimated_rent_dollars,
                        address: row.address,
                        zip_code: row.zip_code,
                        id: row.id
                    })),
                    bounds_used: bounds,
                    total_points: result.rows.length
                });
                
            } catch (error) {
                console.error('Heatmap error:', error);
                res.status(500).json({ error: 'Failed to get heatmap data' });
            }
        });
        
        // GET /api/map/clusters - Clustered data for map performance
        router.get('/clusters', async (req, res) => {
            try {
                const { zoom_level = 8 } = req.query;
                
                // Different clustering based on zoom level
                const gridSize = zoom_level > 10 ? 0.001 : zoom_level > 6 ? 0.01 : 0.1;
                
                const query = `
                    SELECT 
                        ROUND(latitude::numeric / $1) * $1 as cluster_lat,
                        ROUND(longitude::numeric / $1) * $1 as cluster_lng,
                        COUNT(*) as property_count,
                        AVG(price_to_rent_ratio) as avg_ratio,
                        AVG(list_price_dollars) as avg_price
                    FROM property_analytics
                    WHERE latitude IS NOT NULL 
                    AND longitude IS NOT NULL
                    AND price_to_rent_ratio IS NOT NULL
                    GROUP BY cluster_lat, cluster_lng
                    HAVING COUNT(*) >= 1
                    ORDER BY property_count DESC
                    LIMIT 500
                `;
                
                const result = await this.db.query(query, [gridSize]);
                
                res.json({
                    clusters: result.rows.map(row => ({
                        lat: parseFloat(row.cluster_lat),
                        lng: parseFloat(row.cluster_lng),
                        count: parseInt(row.property_count),
                        avg_ratio: parseFloat(row.avg_ratio),
                        avg_price: parseFloat(row.avg_price)
                    })),
                    zoom_level: parseInt(zoom_level),
                    grid_size: gridSize
                });
                
            } catch (error) {
                console.error('Clusters error:', error);
                res.status(500).json({ error: 'Failed to get cluster data' });
            }
        });
        
        return router;
    }
    
    createExportRoutes() {
        const router = express.Router();
        
        // POST /api/export/csv - Export filtered results as CSV
        router.post('/csv', async (req, res) => {
            try {
                const filters = req.body;
                
                // Use the same filtering logic as property search
                // but select all needed columns for export
                let query = `
                    SELECT 
                        address, city, state, zip_code, property_type,
                        bedrooms, bathrooms, square_feet,
                        list_price_dollars as "List Price",
                        estimated_rent_dollars as "Est. Monthly Rent",
                        price_to_rent_ratio as "Price-to-Rent Ratio %",
                        cap_rate as "Cap Rate %",
                        gross_rent_multiplier as "Gross Rent Multiplier",
                        ratio_vs_market_percent as "vs Market %",
                        data_source as "Data Source",
                        last_updated as "Last Updated"
                    FROM property_analytics
                    WHERE 1=1
                `;
                
                // Apply same filters as search endpoint
                // (Implementation would be similar to property search)
                
                const result = await this.db.query(query);
                
                // Convert to CSV format
                const csv = this.convertToCSV(result.rows);
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="roiscout-properties-${Date.now()}.csv"`);
                res.send(csv);
                
            } catch (error) {
                console.error('CSV export error:', error);
                res.status(500).json({ error: 'Failed to export CSV' });
            }
        });
        
        return router;
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }
    
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        });
    }
    
    async start() {
        try {
            // Test database connection
            await this.db.query('SELECT NOW()');
            console.log('✅ Database connected successfully');
            
            this.app.listen(this.port, () => {
                console.log(`🚀 ROIscout Analytics API server running on port ${this.port}`);
                console.log(`📊 API endpoints available at http://localhost:${this.port}/api`);
                console.log(`🏥 Health check: http://localhost:${this.port}/health`);
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new AnalyticsServer();
    server.start();
}

module.exports = AnalyticsServer;
