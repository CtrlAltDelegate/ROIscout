#!/usr/bin/env node

// Complete Data Ingestion Script for ROIscout
// Run with: node scripts/ingest-data.js

const PropertyDataIngestion = require('../backend/PropertyDataIngestion');
const RealEstateAPIs = require('../backend/RealEstateAPIs');
const { Pool } = require('pg');
require('dotenv').config();

class CompleteDataIngestion {
    constructor() {
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.ingestion = new PropertyDataIngestion();
        this.apis = new RealEstateAPIs();
        
        // Configuration
        this.config = {
            zipCodes: process.env.TEST_ZIP_CODES?.split(',') || ['90210', '10001', '60601'],
            propertiesPerZip: 25,
            includeRentals: true,
            enableMockData: process.env.ENABLE_MOCK_DATA === 'true',
            cleanupOldData: true
        };
    }

    // Initialize database tables if they don't exist
    async initializeDatabase() {
        console.log('🔧 Initializing database...');
        
        try {
            // Check if properties table exists
            const tableCheck = await this.db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'properties'
                );
            `);
            
            if (!tableCheck.rows[0].exists) {
                console.log('📋 Creating database tables...');
                
                // Read and execute the schema file
                const fs = require('fs');
                const path = require('path');
                const schemaPath = path.join(__dirname, '../database/schema.sql');
                
                if (fs.existsSync(schemaPath)) {
                    const schema = fs.readFileSync(schemaPath, 'utf8');
                    await this.db.query(schema);
                    console.log('✅ Database tables created successfully');
                } else {
                    console.log('⚠️ Schema file not found, using inline schema...');
                    await this.createTablesInline();
                }
            } else {
                console.log('✅ Database tables already exist');
            }
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            throw error;
        }
    }

    // Create tables inline if schema file doesn't exist
    async createTablesInline() {
        const createTablesSQL = `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            CREATE TABLE IF NOT EXISTS properties (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                external_id VARCHAR(100) UNIQUE,
                address VARCHAR(500) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(50) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                property_type VARCHAR(50),
                bedrooms INTEGER,
                bathrooms DECIMAL(3,1),
                square_feet INTEGER,
                year_built INTEGER,
                list_price INTEGER,
                estimated_rent INTEGER,
                price_to_rent_ratio DECIMAL(6,2),
                cap_rate DECIMAL(5,2),
                data_source VARCHAR(50),
                property_metadata JSONB,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true
            );
            
            CREATE TABLE IF NOT EXISTS rental_comps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                external_id VARCHAR(100),
                address VARCHAR(500),
                city VARCHAR(100),
                state VARCHAR(50),
                zip_code VARCHAR(10),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                bedrooms INTEGER,
                bathrooms DECIMAL(3,1),
                square_feet INTEGER,
                monthly_rent INTEGER,
                data_source VARCHAR(50),
                listing_date DATE,
                comp_metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true
            );
            
            CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties (zip_code);
            CREATE INDEX IF NOT EXISTS idx_properties_ratio ON properties (price_to_rent_ratio);
            CREATE INDEX IF NOT EXISTS idx_rental_comps_zip ON rental_comps (zip_code);
        `;
        
        await this.db.query(createTablesSQL);
    }

    // Clean up old data
    async cleanupOldData() {
        if (!this.config.cleanupOldData) return;
        
        console.log('🧹 Cleaning up old data...');
        
        try {
            const maxAge = process.env.MAX_PROPERTY_AGE_DAYS || 90;
            
            const result = await this.db.query(`
                UPDATE properties 
                SET is_active = false 
                WHERE last_updated < NOW() - INTERVAL '${maxAge} days'
                AND is_active = true
            `);
            
            const rentalResult = await this.db.query(`
                UPDATE rental_comps 
                SET is_active = false 
                WHERE created_at < NOW() - INTERVAL '${maxAge} days'
                AND is_active = true
            `);
            
            console.log(`✅ Cleaned up ${result.rowCount} properties and ${rentalResult.rowCount} rental comps`);
        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }

    // Get zip code metadata (city, state info)
    async getZipCodeInfo(zipCode) {
        try {
            // Try to get from existing data first
            const existing = await this.db.query(`
                SELECT city, state 
                FROM properties 
                WHERE zip_code = $1 
                AND city IS NOT NULL 
                AND state IS NOT NULL
                LIMIT 1
            `, [zipCode]);
            
            if (existing.rows.length > 0) {
                return existing.rows[0];
            }
            
            // Fallback to a simple mapping or API call
            const zipMappings = {
                '90210': { city: 'Beverly Hills', state: 'CA' },
                '10001': { city: 'New York', state: 'NY' },
                '60601': { city: 'Chicago', state: 'IL' },
                '30309': { city: 'Atlanta', state: 'GA' },
                '78701': { city: 'Austin', state: 'TX' }
            };
            
            return zipMappings[zipCode] || { city: 'Unknown', state: 'Unknown' };
        } catch (error) {
            console.error(`Error getting zip code info for ${zipCode}:`, error);
            return { city: 'Unknown', state: 'Unknown' };
        }
    }

    // Process a single zip code
    async processZipCode(zipCode) {
        console.log(`\n🏠 Processing zip code: ${zipCode}`);
        
        try {
            const zipInfo = await this.getZipCodeInfo(zipCode);
            const results = {
                properties: 0,
                rentals: 0,
                errors: []
            };
            
            if (this.config.enableMockData) {
                // Use mock data for development
                console.log('📊 Using mock data...');
                await this.ingestion.ingestMarketData([zipCode], {
                    propertiesPerZip: this.config.propertiesPerZip,
                    includeRentals: this.config.includeRentals
                });
                results.properties = this.config.propertiesPerZip;
                results.rentals = this.config.includeRentals ? 20 : 0;
            } else {
                // Use real API data
                console.log('🌐 Fetching real market data...');
                
                const apiResults = await this.apis.gatherAllData(zipCode, {
                    includeRealtor: true,
                    includeBridge: true,
                    includeRentals: true,
                    includeApartments: true,
                    includeCraigslist: false, // Disabled for safety
                    city: zipInfo.city,
                    state: zipInfo.state
                });
                
                // Process properties
                for (const property of apiResults.properties) {
                    try {
                        // Estimate rent if not provided
                        if (!property.estimated_rent) {
                            const rentEstimate = await this.apis.estimateRentMultiSource(property);
                            property.estimated_rent = rentEstimate.estimated_rent;
                            
                            // Add estimation metadata
                            property.property_metadata = {
                                ...property.property_metadata,
                                rent_estimation: rentEstimate
                            };
                        }
                        
                        await this.ingestion.insertProperty(property);
                        results.properties++;
                    } catch (error) {
                        console.error(`Error processing property ${property.external_id}:`, error.message);
                        results.errors.push(`Property ${property.external_id}: ${error.message}`);
                    }
                }
                
                // Process rental comps
                for (const rental of apiResults.rentals) {
                    try {
                        await this.ingestion.insertRentalComp(rental);
                        results.rentals++;
                    } catch (error) {
                        console.error(`Error processing rental ${rental.external_id}:`, error.message);
                        results.errors.push(`Rental ${rental.external_id}: ${error.message}`);
                    }
                }
                
                // Store market data
                await this.storeMarketData(zipCode, apiResults.market_data);
                
                results.errors.push(...apiResults.errors);
            }
            
            console.log(`✅ ${zipCode} complete: ${results.properties} properties, ${results.rentals} rentals`);
            if (results.errors.length > 0) {
                console.log(`⚠️ ${results.errors.length} errors occurred`);
            }
            
            return results;
        } catch (error) {
            console.error(`❌ Failed to process ${zipCode}:`, error);
            return { properties: 0, rentals: 0, errors: [error.message] };
        }
    }

    // Store market data for analytics
    async storeMarketData(zipCode, marketData) {
        if (!marketData || Object.keys(marketData).length === 0) return;
        
        try {
            for (const [bedroomType, data] of Object.entries(marketData)) {
                const insertQuery = `
                    INSERT INTO market_data (
                        area_type, area_value, median_home_price, median_rent,
                        average_price_to_rent_ratio, data_date
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (area_type, area_value, data_date) 
                    DO UPDATE SET
                        median_rent = EXCLUDED.median_rent,
                        average_price_to_rent_ratio = EXCLUDED.average_price_to_rent_ratio
                `;
                
                await this.db.query(insertQuery, [
                    'zip_code',
                    zipCode,
                    null, // median_home_price (not from this source)
                    data.median_rent * 100, // Convert to cents
                    null, // Will be calculated later
                    new Date().toISOString().split('T')[0]
                ]);
            }
        } catch (error) {
            console.error('Error storing market data:', error);
        }
    }

    // Calculate market statistics after ingestion
    async calculateMarketStats() {
        console.log('📈 Calculating market statistics...');
        
        try {
            // Update average price-to-rent ratios by zip code
            await this.db.query(`
                INSERT INTO market_data (area_type, area_value, average_price_to_rent_ratio, data_date)
                SELECT 
                    'zip_code' as area_type,
                    zip_code as area_value,
                    AVG(price_to_rent_ratio) as average_price_to_rent_ratio,
                    CURRENT_DATE as data_date
                FROM properties 
                WHERE is_active = true 
                AND price_to_rent_ratio IS NOT NULL
                GROUP BY zip_code
                ON CONFLICT (area_type, area_value, data_date)
                DO UPDATE SET average_price_to_rent_ratio = EXCLUDED.average_price_to_rent_ratio
            `);
            
            // Calculate median prices by zip code
            await this.db.query(`
                INSERT INTO market_data (area_type, area_value, median_home_price, data_date)
                SELECT 
                    'zip_code' as area_type,
                    zip_code as area_value,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) as median_home_price,
                    CURRENT_DATE as data_date
                FROM properties 
                WHERE is_active = true 
                AND list_price IS NOT NULL
                GROUP BY zip_code
                ON CONFLICT (area_type, area_value, data_date)
                DO UPDATE SET median_home_price = EXCLUDED.median_home_price
            `);
            
            console.log('✅ Market statistics updated');
        } catch (error) {
            console.error('❌ Error calculating market stats:', error);
        }
    }

    // Generate ingestion report
    async generateReport(results) {
        console.log('\n📋 INGESTION REPORT');
        console.log('==================');
        
        const totalProperties = results.reduce((sum, r) => sum + r.properties, 0);
        const totalRentals = results.reduce((sum, r) => sum + r.rentals, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
        
        console.log(`📊 Total Properties: ${totalProperties}`);
        console.log(`🏠 Total Rentals: ${totalRentals}`);
        console.log(`❌ Total Errors: ${totalErrors}`);
        console.log(`📍 Zip Codes Processed: ${results.length}`);
        
        // Get database stats
        try {
            const dbStats = await this.db.query(`
                SELECT 
                    COUNT(*) as total_properties,
                    COUNT(DISTINCT zip_code) as unique_zip_codes,
                    AVG(price_to_rent_ratio) as avg_ratio,
                    MIN(price_to_rent_ratio) as min_ratio,
                    MAX(price_to_rent_ratio) as max_ratio
                FROM properties 
                WHERE is_active = true
            `);
            
            const rentalStats = await this.db.query(`
                SELECT COUNT(*) as total_rentals
                FROM rental_comps 
                WHERE is_active = true
            `);
            
            if (dbStats.rows[0]) {
                const stats = dbStats.rows[0];
                console.log(`\n📈 DATABASE STATISTICS`);
                console.log(`Total Active Properties: ${stats.total_properties}`);
                console.log(`Total Active Rentals: ${rentalStats.rows[0].total_rentals}`);
                console.log(`Unique Zip Codes: ${stats.unique_zip_codes}`);
                console.log(`Average Price-to-Rent Ratio: ${parseFloat(stats.avg_ratio || 0).toFixed(2)}%`);
                console.log(`Ratio Range: ${parseFloat(stats.min_ratio || 0).toFixed(2)}% - ${parseFloat(stats.max_ratio || 0).toFixed(2)}%`);
            }
        } catch (error) {
            console.error('Error generating database stats:', error);
        }
        
        // Show top deals
        try {
            const topDeals = await this.db.query(`
                SELECT address, city, state, list_price/100 as price, 
                       estimated_rent/100 as rent, price_to_rent_ratio
                FROM properties 
                WHERE is_active = true 
                AND price_to_rent_ratio IS NOT NULL
                ORDER BY price_to_rent_ratio DESC
                LIMIT 5
            `);
            
            if (topDeals.rows.length > 0) {
                console.log(`\n🏆 TOP 5 DEALS (Highest Rent-to-Price Ratios):`);
                topDeals.rows.forEach((deal, i) => {
                    console.log(`${i + 1}. ${deal.address}, ${deal.city}, ${deal.state}`);
                    console.log(`   Price: ${deal.price.toLocaleString()}, Rent: ${deal.rent}, Ratio: ${deal.price_to_rent_ratio}%`);
                });
            }
        } catch (error) {
            console.error('Error getting top deals:', error);
        }
        
        if (totalErrors > 0) {
            console.log(`\n⚠️ ERRORS SUMMARY:`);
            results.forEach((result, i) => {
                if (result.errors.length > 0) {
                    console.log(`Zip Code ${this.config.zipCodes[i]}:`);
                    result.errors.forEach(error => console.log(`  - ${error}`));
                }
            });
        }
        
        console.log(`\n✅ Ingestion completed at ${new Date().toISOString()}`);
    }

    // Main execution function
    async run() {
        const startTime = Date.now();
        console.log('🚀 Starting ROIscout Data Ingestion');
        console.log(`📅 ${new Date().toISOString()}`);
        console.log(`🎯 Processing ${this.config.zipCodes.length} zip codes`);
        console.log(`⚙️ Mock data: ${this.config.enableMockData ? 'ENABLED' : 'DISABLED'}`);
        
        try {
            // Initialize
            await this.initializeDatabase();
            await this.cleanupOldData();
            
            // Process each zip code
            const results = [];
            for (const zipCode of this.config.zipCodes) {
                const result = await this.processZipCode(zipCode);
                results.push(result);
                
                // Brief pause between zip codes
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Post-processing
            await this.calculateMarketStats();
            await this.generateReport(results);
            
            const duration = (Date.now() - startTime) / 1000;
            console.log(`\n⏱️ Total execution time: ${duration.toFixed(1)} seconds`);
            
        } catch (error) {
            console.error('❌ Ingestion failed:', error);
            process.exit(1);
        } finally {
            await this.db.end();
            await this.ingestion.close();
        }
    }
}

// CLI argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--zip-codes':
                config.zipCodes = args[++i]?.split(',');
                break;
            case '--properties-per-zip':
                config.propertiesPerZip = parseInt(args[++i]);
                break;
            case '--mock-data':
                config.enableMockData = args[++i] === 'true';
                break;
            case '--no-rentals':
                config.includeRentals = false;
                break;
            case '--no-cleanup':
                config.cleanupOldData = false;
                break;
            case '--help':
                console.log(`
ROIscout Data Ingestion Script

Usage: node scripts/ingest-data.js [options]

Options:
  --zip-codes <codes>      Comma-separated zip codes (default: from .env)
  --properties-per-zip <n> Properties to fetch per zip code (default: 25)
  --mock-data <true/false> Use mock data instead of real APIs (default: from .env)
  --no-rentals            Skip rental comp data ingestion
  --no-cleanup            Skip cleanup of old data
  --help                  Show this help message

Examples:
  node scripts/ingest-data.js --zip-codes 90210,10001 --properties-per-zip 50
  node scripts/ingest-data.js --mock-data true --no-rentals
                `);
                process.exit(0);
        }
    }
    
    return config;
}

// Main execution
if (require.main === module) {
    const cliConfig = parseArgs();
    const ingestion = new CompleteDataIngestion();
    
    // Override config with CLI arguments
    Object.assign(ingestion.config, cliConfig);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await ingestion.db.end();
        process.exit(0);
    });
    
    // Run the ingestion
    ingestion.run().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = CompleteDataIngestion;
