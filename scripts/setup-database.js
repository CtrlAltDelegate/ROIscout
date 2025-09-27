#!/usr/bin/env node

// Database Setup and Migration Script
// Run with: node scripts/setup-database.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DatabaseSetup {
    constructor() {
        // Connect to PostgreSQL without specifying database first
        this.adminDb = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'postgres' // Connect to default postgres db first
        });
        
        this.dbName = process.env.DB_NAME || 'roiscout_db';
    }

    // Create database if it doesn't exist
    async createDatabase() {
        try {
            console.log(`🔍 Checking if database '${this.dbName}' exists...`);
            
            const result = await this.adminDb.query(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                [this.dbName]
            );
            
            if (result.rows.length === 0) {
                console.log(`📋 Creating database '${this.dbName}'...`);
                await this.adminDb.query(`CREATE DATABASE "${this.dbName}"`);
                console.log(`✅ Database '${this.dbName}' created successfully`);
            } else {
                console.log(`✅ Database '${this.dbName}' already exists`);
            }
        } catch (error) {
            console.error('❌ Error creating database:', error);
            throw error;
        }
    }

    // Connect to the target database
    async connectToTargetDB() {
        await this.adminDb.end();
        
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Test connection
        await this.db.query('SELECT NOW()');
        console.log(`🔗 Connected to database '${this.dbName}'`);
    }

    // Run database schema
    async runSchema() {
        console.log('📋 Creating database schema...');
        
        const schemaSQL = `
            -- Enable UUID extension
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            -- Properties table
            CREATE TABLE IF NOT EXISTS properties (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                external_id VARCHAR(100) UNIQUE,
                address VARCHAR(500) NOT NULL,
                street_number VARCHAR(20),
                street_name VARCHAR(200),
                unit VARCHAR(50),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(50) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                county VARCHAR(100),
                
                -- Geographic data
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                neighborhood VARCHAR(200),
                school_district VARCHAR(200),
                
                -- Property details
                property_type VARCHAR(50),
                bedrooms INTEGER,
                bathrooms DECIMAL(3,1),
                square_feet INTEGER,
                lot_size_sqft INTEGER,
                year_built INTEGER,
                
                -- Financial data
                list_price INTEGER,
                estimated_rent INTEGER,
                price_per_sqft INTEGER,
                
                -- Calculated metrics
                price_to_rent_ratio DECIMAL(6,2),
                cap_rate DECIMAL(5,2),
                
                -- Metadata
                data_source VARCHAR(50),
                property_metadata JSONB,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                
                -- Status
                is_active BOOLEAN DEFAULT true,
                listing_status VARCHAR(50) DEFAULT 'active'
            );
            
            -- Rental comparables table
            CREATE TABLE IF NOT EXISTS rental_comps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                property_id UUID REFERENCES properties(id),
                external_id VARCHAR(100),
                
                -- Location
                address VARCHAR(500),
                city VARCHAR(100),
                state VARCHAR(50),
                zip_code VARCHAR(10),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                
                -- Property details
                bedrooms INTEGER,
                bathrooms DECIMAL(3,1),
                square_feet INTEGER,
                monthly_rent INTEGER,
                
                -- Metadata
                data_source VARCHAR(50),
                listing_date DATE,
                comp_metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                
                is_active BOOLEAN DEFAULT true
            );
            
            -- Property amenities table
            CREATE TABLE IF NOT EXISTS property_amenities (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                property_id UUID REFERENCES properties(id),
                amenity_type VARCHAR(100),
                amenity_value VARCHAR(200),
                distance_miles DECIMAL(5,2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Market data table
            CREATE TABLE IF NOT EXISTS market_data (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                area_type VARCHAR(20),
                area_value VARCHAR(100),
                
                -- Market metrics
                median_home_price INTEGER,
                median_rent INTEGER,
                average_price_to_rent_ratio DECIMAL(6,2),
                total_listings INTEGER,
                average_days_on_market INTEGER,
                
                -- Time period
                data_date DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                
                UNIQUE(area_type, area_value, data_date)
            );
            
            -- User favorites table (for later)
            CREATE TABLE IF NOT EXISTS user_favorites (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID,
                property_id UUID REFERENCES properties(id),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        await this.db.query(schemaSQL);
        console.log('✅ Database schema created successfully');
    }

    // Create indexes for performance
    async createIndexes() {
        console.log('🚀 Creating database indexes...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_properties_location ON properties (latitude, longitude)',
            'CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties (zip_code)',
            'CREATE INDEX IF NOT EXISTS idx_properties_price_range ON properties (list_price)',
            'CREATE INDEX IF NOT EXISTS idx_properties_ratio ON properties (price_to_rent_ratio)',
            'CREATE INDEX IF NOT EXISTS idx_properties_updated ON properties (last_updated)',
            'CREATE INDEX IF NOT EXISTS idx_properties_active ON properties (is_active)',
            'CREATE INDEX IF NOT EXISTS idx_rental_comps_location ON rental_comps (latitude, longitude)',
            'CREATE INDEX IF NOT EXISTS idx_rental_comps_zip ON rental_comps (zip_code)',
            'CREATE INDEX IF NOT EXISTS idx_market_data_area ON market_data (area_type, area_value, data_date)',
            'CREATE INDEX IF NOT EXISTS idx_properties_metadata ON properties USING GIN (property_metadata)',
            'CREATE INDEX IF NOT EXISTS idx_rental_comps_metadata ON rental_comps USING GIN (comp_metadata)'
        ];
        
        for (const indexSQL of indexes) {
            await this.db.query(indexSQL);
        }
        
        console.log('✅ Database indexes created successfully');
    }

    // Create views for analytics
    async createViews() {
        console.log('📊 Creating database views...');
        
        const viewSQL = `
            -- Property analytics view
            CREATE OR REPLACE VIEW property_analytics AS
            SELECT 
                p.id,
                p.external_id,
                p.address,
                p.city,
                p.state,
                p.zip_code,
                p.property_type,
                p.bedrooms,
                p.bathrooms,
                p.square_feet,
                p.list_price / 100.0 as list_price_dollars,
                p.estimated_rent / 100.0 as estimated_rent_dollars,
                p.price_to_rent_ratio,
                p.cap_rate,
                
                -- Calculate additional metrics
                CASE 
                    WHEN p.estimated_rent > 0 THEN 
                        ROUND((p.list_price::decimal / p.estimated_rent / 12) * 100, 2)
                    ELSE NULL 
                END as gross_rent_multiplier,
                
                -- Market comparison
                CASE 
                    WHEN md.average_price_to_rent_ratio > 0 THEN
                        ROUND((p.price_to_rent_ratio / md.average_price_to_rent_ratio - 1) * 100, 1)
                    ELSE NULL
                END as ratio_vs_market_percent,
                
                p.latitude,
                p.longitude,
                p.data_source,
                p.last_updated,
                p.created_at
            FROM properties p
            LEFT JOIN market_data md ON md.area_type = 'zip_code' 
                AND md.area_value = p.zip_code 
                AND md.data_date = (
                    SELECT MAX(data_date) 
                    FROM market_data md2 
                    WHERE md2.area_type = 'zip_code' 
                    AND md2.area_value = p.zip_code
                )
            WHERE p.is_active = true;
            
            -- Market summary view
            CREATE OR REPLACE VIEW market_summary AS
            SELECT 
                zip_code,
                COUNT(*) as total_properties,
                AVG(list_price / 100.0) as avg_price,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price / 100.0) as median_price,
                AVG(estimated_rent / 100.0) as avg_rent,
                AVG(price_to_rent_ratio) as avg_ratio,
                MIN(price_to_rent_ratio) as min_ratio,
                MAX(price_to_rent_ratio) as max_ratio,
                COUNT(CASE WHEN price_to_rent_ratio > 1.0 THEN 1 END) as high_ratio_count
            FROM properties 
            WHERE is_active = true 
            AND list_price > 0 
            AND estimated_rent > 0
            GROUP BY zip_code;
        `;
        
        await this.db.query(viewSQL);
        console.log('✅ Database views created successfully');
    }

    // Insert sample data for testing
    async insertSampleData() {
        console.log('📝 Inserting sample data...');
        
        const sampleProperties = [
            {
                external_id: 'sample_1',
                address: '123 Sample Street',
                city: 'Los Angeles',
                state: 'CA',
                zip_code: '90210',
                latitude: 34.0902,
                longitude: -118.4065,
                property_type: 'single_family',
                bedrooms: 3,
                bathrooms: 2.0,
                square_feet: 1500,
                year_built: 1995,
                list_price: 75000000, // $750,000 in cents
                estimated_rent: 350000, // $3,500 in cents
                data_source: 'sample'
            },
            {
                external_id: 'sample_2',
                address: '456 Example Ave',
                city: 'Los Angeles',
                state: 'CA',
                zip_code: '90210',
                latitude: 34.0912,
                longitude: -118.4075,
                property_type: 'condo',
                bedrooms: 2,
                bathrooms: 2.0,
                square_feet: 1200,
                year_built: 2005,
                list_price: 60000000, // $600,000 in cents
                estimated_rent: 280000, // $2,800 in cents
                data_source: 'sample'
            }
        ];
        
        for (const property of sampleProperties) {
            // Calculate metrics
            const priceToRentRatio = (property.estimated_rent / property.list_price) * 100;
            const capRate = ((property.estimated_rent * 12) / property.list_price) * 100;
            
            const insertSQL = `
                INSERT INTO properties (
                    external_id, address, city, state, zip_code,
                    latitude, longitude, property_type, bedrooms, bathrooms,
                    square_feet, year_built, list_price, estimated_rent,
                    price_to_rent_ratio, cap_rate, data_source, property_metadata
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18
                )
                ON CONFLICT (external_id) DO NOTHING
            `;
            
            await this.db.query(insertSQL, [
                property.external_id,
                property.address,
                property.city,
                property.state,
                property.zip_code,
                property.latitude,
                property.longitude,
                property.property_type,
                property.bedrooms,
                property.bathrooms,
                property.square_feet,
                property.year_built,
                property.list_price,
                property.estimated_rent,
                Math.round(priceToRentRatio * 100) / 100,
                Math.round(capRate * 100) / 100,
                property.data_source,
                JSON.stringify({ sample: true, created_by: 'setup_script' })
            ]);
        }
        
        console.log(`✅ Inserted ${sampleProperties.length} sample properties`);
    }

    // Verify setup
    async verifySetup() {
        console.log('🔍 Verifying database setup...');
        
        try {
            // Check tables
            const tables = await this.db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);
            
            console.log(`📋 Tables created: ${tables.rows.map(r => r.table_name).join(', ')}`);
            
            // Check sample data
            const propertyCount = await this.db.query('SELECT COUNT(*) FROM properties');
            const rentalCount = await this.db.query('SELECT COUNT(*) FROM rental_comps');
            
            console.log(`🏠 Properties: ${propertyCount.rows[0].count}`);
            console.log(`🏠 Rental Comps: ${rentalCount.rows[0].count}`);
            
            // Test views
            const analyticsTest = await this.db.query('SELECT COUNT(*) FROM property_analytics');
            const marketTest = await this.db.query('SELECT COUNT(*) FROM market_summary');
            
            console.log(`📊 Analytics view: ${analyticsTest.rows[0].count} records`);
            console.log(`📈 Market summary: ${marketTest.rows[0].count} zip codes`);
            
            console.log('✅ Database setup verification completed');
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            throw error;
        }
    }

    // Main setup process
    async setup(options = {}) {
        const { 
            createDb = true, 
            runSchema = true, 
            createIndexes = true, 
            createViews = true, 
            insertSample = true,
            verify = true 
        } = options;
        
        try {
            console.log('🚀 Starting ROIscout Database Setup');
            console.log('=====================================');
            
            if (createDb) await this.createDatabase();
            await this.connectToTargetDB();
            if (runSchema) await this.runSchema();
            if (createIndexes) await this.createIndexes();
            if (createViews) await this.createViews();
            if (insertSample) await this.insertSampleData();
            if (verify) await this.verifySetup();
            
            console.log('\n🎉 Database setup completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Run: node scripts/ingest-data.js --mock-data true');
            console.log('2. Start the backend server: npm run dev');
            console.log('3. Begin frontend development');
            
        } catch (error) {
            console.error('❌ Database setup failed:', error);
            throw error;
        } finally {
            if (this.db) await this.db.end();
            if (this.adminDb) await this.adminDb.end();
        }
    }

    async cleanup() {
        if (this.db) await this.db.end();
        if (this.adminDb) await this.adminDb.end();
    }
}

// CLI argument parsing
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--no-create-db':
                options.createDb = false;
                break;
            case '--no-schema':
                options.runSchema = false;
                break;
            case '--no-indexes':
                options.createIndexes = false;
                break;
            case '--no-views':
                options.createViews = false;
                break;
            case '--no-sample':
                options.insertSample = false;
                break;
            case '--no-verify':
                options.verify = false;
                break;
            case '--reset':
                options.reset = true;
                break;
            case '--help':
                console.log(`
ROIscout Database Setup Script

Usage: node scripts/setup-database.js [options]

Options:
  --no-create-db    Skip database creation
  --no-schema       Skip schema creation
  --no-indexes      Skip index creation
  --no-views        Skip view creation
  --no-sample       Skip sample data insertion
  --no-verify       Skip setup verification
  --reset           Drop and recreate everything (DESTRUCTIVE)
  --help            Show this help message

Examples:
  node scripts/setup-database.js                    # Full setup
  node scripts/setup-database.js --no-sample        # Setup without sample data
  node scripts/setup-database.js --reset            # Reset everything
                `);
                process.exit(0);
        }
    }
    
    return options;
}

// Reset database function
async function resetDatabase() {
    console.log('⚠️  RESETTING DATABASE - THIS WILL DELETE ALL DATA!');
    console.log('Are you sure? This action cannot be undone.');
    
    // In a real script, you'd want to add a confirmation prompt
    // For now, we'll just proceed with the reset
    
    const dbSetup = new DatabaseSetup();
    
    try {
        await dbSetup.connectToTargetDB();
        
        console.log('🗑️  Dropping all tables...');
        const dropSQL = `
            DROP VIEW IF EXISTS property_analytics CASCADE;
            DROP VIEW IF EXISTS market_summary CASCADE;
            DROP TABLE IF EXISTS user_favorites CASCADE;
            DROP TABLE IF EXISTS property_amenities CASCADE;
            DROP TABLE IF EXISTS market_data CASCADE;
            DROP TABLE IF EXISTS rental_comps CASCADE;
            DROP TABLE IF EXISTS properties CASCADE;
        `;
        
        await dbSetup.db.query(dropSQL);
        console.log('✅ All tables dropped');
        
        await dbSetup.cleanup();
        
        // Now run full setup
        const newSetup = new DatabaseSetup();
        await newSetup.setup();
        
    } catch (error) {
        console.error('❌ Reset failed:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    const options = parseArgs();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        process.exit(0);
    });
    
    async function main() {
        if (options.reset) {
            await resetDatabase();
        } else {
            const dbSetup = new DatabaseSetup();
            await dbSetup.setup(options);
        }
    }
    
    main().catch(error => {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    });
}

module.exports = DatabaseSetup;
