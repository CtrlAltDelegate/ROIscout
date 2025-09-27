// ROIscout Backend Server Entry Point
// File: backend/server.js

require('dotenv').config();
const AnalyticsServer = require('./AnalyticsServer');
const AnalyticsUtils = require('./AnalyticsUtils');
const { Pool } = require('pg');

class ROIscoutBackend {
    constructor() {
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.analyticsUtils = new AnalyticsUtils(this.db);
        this.server = new AnalyticsServer();
        
        // Add analytics utilities to server for enhanced endpoints
        this.server.analyticsUtils = this.analyticsUtils;
        this.setupEnhancedRoutes();
    }

    setupEnhancedRoutes() {
        // Enhanced analytics endpoints using AnalyticsUtils
        
        // GET /api/analytics/property/:id/report - Comprehensive property analysis
        this.server.app.get('/api/analytics/property/:id/report', async (req, res) => {
            try {
                const { id } = req.params;
                const report = await this.analyticsUtils.generatePropertyReport(id);
                res.json(report);
            } catch (error) {
                console.error('Property report error:', error);
                res.status(500).json({ error: 'Failed to generate property report' });
            }
        });

        // GET /api/analytics/property/:id/score - Property investment score
        this.server.app.get('/api/analytics/property/:id/score', async (req, res) => {
            try {
                const { id } = req.params;
                
                const property = await this.db.query(`
                    SELECT * FROM property_analytics WHERE id = $1
                `, [id]);

                if (property.rows.length === 0) {
                    return res.status(404).json({ error: 'Property not found' });
                }

                const marketAnalysis = await this.analyticsUtils.analyzeMarketPosition(id);
                const score = this.analyticsUtils.scoreProperty(
                    property.rows[0], 
                    marketAnalysis.market_stats
                );

                res.json({
                    property_id: id,
                    score_analysis: score,
                    market_position: marketAnalysis.analysis
                });
            } catch (error) {
                console.error('Property scoring error:', error);
                res.status(500).json({ error: 'Failed to score property' });
            }
        });

        // GET /api/analytics/anomalies/advanced - Advanced anomaly detection
        this.server.app.get('/api/analytics/anomalies/advanced', async (req, res) => {
            try {
                const filters = {
                    zipCode: req.query.zip_code,
                    minImprovement: parseFloat(req.query.min_improvement) || 15,
                    maxPrice: req.query.max_price ? parseFloat(req.query.max_price) : null,
                    propertyType: req.query.property_type,
                    minRatio: parseFloat(req.query.min_ratio) || 1.0
                };

                const anomalies = await this.analyticsUtils.findAnomalies(filters);
                res.json(anomalies);
            } catch (error) {
                console.error('Advanced anomalies error:', error);
                res.status(500).json({ error: 'Failed to find anomalies' });
            }
        });

        // GET /api/analytics/trends/market - Market trend analysis
        this.server.app.get('/api/analytics/trends/market', async (req, res) => {
            try {
                const timeframe = req.query.timeframe || '30 days';
                const trends = await this.analyticsUtils.calculateMarketTrends(timeframe);
                res.json(trends);
            } catch (error) {
                console.error('Market trends error:', error);
                res.status(500).json({ error: 'Failed to calculate market trends' });
            }
        });

        // GET /api/analytics/investment-metrics - Calculate investment metrics
        this.server.app.post('/api/analytics/investment-metrics', async (req, res) => {
            try {
                const { list_price, monthly_rent, expenses = {} } = req.body;
                
                if (!list_price || !monthly_rent) {
                    return res.status(400).json({ 
                        error: 'list_price and monthly_rent are required' 
                    });
                }

                const metrics = this.analyticsUtils.calculateInvestmentMetrics(
                    list_price, 
                    monthly_rent, 
                    expenses
                );

                res.json({
                    input: { list_price, monthly_rent, expenses },
                    metrics
                });
            } catch (error) {
                console.error('Investment metrics error:', error);
                res.status(500).json({ error: 'Failed to calculate investment metrics' });
            }
        });

        console.log('✅ Enhanced analytics routes configured');
    }

    async start() {
        try {
            console.log('🚀 Starting ROIscout Backend Server...');
            console.log('=====================================');
            
            // Test database connection
            await this.db.query('SELECT NOW()');
            console.log('✅ Database connection established');
            
            // Verify required tables exist
            const tables = await this.db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('properties', 'rental_comps', 'market_data')
            `);
            
            if (tables.rows.length < 3) {
                console.log('⚠️ Warning: Some database tables may be missing');
                console.log('   Run: node scripts/setup-database.js');
            } else {
                console.log('✅ Database tables verified');
            }
            
            // Check for sample data
            const propertyCount = await this.db.query('SELECT COUNT(*) FROM properties WHERE is_active = true');
            console.log(`📊 Active properties in database: ${propertyCount.rows[0].count}`);
            
            if (propertyCount.rows[0].count === '0') {
                console.log('💡 No properties found. Run data ingestion:');
                console.log('   node scripts/ingest-data.js --mock-data true');
            }
            
            // Start the server
            await this.server.start();
            
            console.log('\n🎯 Available API Endpoints:');
            console.log('===========================');
            console.log('Properties:');
            console.log('  GET  /api/properties - Search properties');
            console.log('  GET  /api/properties/:id - Property details');
            console.log('');
            console.log('Analytics:');
            console.log('  GET  /api/analytics/market-summary - Market statistics');
            console.log('  GET  /api/analytics/anomalies - Find exceptional deals');
            console.log('  GET  /api/analytics/trends - Market trends');
            console.log('  GET  /api/analytics/property/:id/report - Full property analysis');
            console.log('  GET  /api/analytics/property/:id/score - Investment score');
            console.log('  POST /api/analytics/investment-metrics - Calculate metrics');
            console.log('');
            console.log('Map Data:');
            console.log('  GET  /api/map/heatmap - Heatmap data for visualization');
            console.log('  GET  /api/map/clusters - Clustered data for performance');
            console.log('');
            console.log('Export:');
            console.log('  POST /api/export/csv - Export search results as CSV');
            console.log('');
            console.log('🌐 Ready for frontend integration!');
            
        } catch (error) {
            console.error('❌ Failed to start ROIscout backend:', error);
            process.exit(1);
        }
    }

    async gracefulShutdown(signal) {
        console.log(`\n📝 Received ${signal}, starting graceful shutdown...`);
        
        try {
            // Close database connections
            await this.db.end();
            console.log('✅ Database connections closed');
            
            console.log('👋 ROIscout backend shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Initialize and start the backend
const backend = new ROIscoutBackend();

// Handle graceful shutdown
process.on('SIGTERM', () => backend.gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => backend.gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
backend.start();
