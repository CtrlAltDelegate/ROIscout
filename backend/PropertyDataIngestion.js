// Property Data Ingestion System
// Node.js modules for scraping and normalizing property data

const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
require('dotenv').config();

class PropertyDataIngestion {
    constructor() {
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Rate limiting
        this.requestDelay = 2000; // 2 seconds between requests
        this.maxRetries = 3;
    }

    // Delay function for rate limiting
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Normalize address components
    normalizeAddress(rawAddress) {
        if (!rawAddress) return {};
        
        const addressParts = rawAddress.trim().split(',');
        const streetAddress = addressParts[0]?.trim() || '';
        const city = addressParts[1]?.trim() || '';
        const stateZip = addressParts[2]?.trim() || '';
        
        // Extract state and zip
        const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
        const state = stateZipMatch ? stateZipMatch[1] : stateZip;
        const zipCode = stateZipMatch ? stateZipMatch[2].split('-')[0] : '';
        
        // Extract street number and name
        const streetMatch = streetAddress.match(/^(\d+)\s+(.+)$/);
        const streetNumber = streetMatch ? streetMatch[1] : '';
        const streetName = streetMatch ? streetMatch[2] : streetAddress;
        
        return {
            address: rawAddress,
            streetNumber,
            streetName,
            city,
            state,
            zipCode
        };
    }

    // Normalize property type
    normalizePropertyType(rawType) {
        if (!rawType) return 'unknown';
        
        const type = rawType.toLowerCase();
        if (type.includes('single') || type.includes('sfr') || type.includes('detached')) return 'single_family';
        if (type.includes('condo') || type.includes('condominium')) return 'condo';
        if (type.includes('town') || type.includes('row')) return 'townhouse';
        if (type.includes('multi') || type.includes('duplex') || type.includes('triplex')) return 'multi_family';
        if (type.includes('apartment')) return 'apartment';
        
        return 'other';
    }

    // Calculate price-to-rent ratio and other metrics
    calculateMetrics(listPrice, estimatedRent) {
        if (!listPrice || !estimatedRent || listPrice <= 0 || estimatedRent <= 0) {
            return { priceToRentRatio: null, capRate: null };
        }
        
        // Price-to-rent ratio: monthly rent / purchase price * 100
        const priceToRentRatio = (estimatedRent / listPrice) * 100;
        
        // Cap rate: annual rent / purchase price * 100
        const capRate = ((estimatedRent * 12) / listPrice) * 100;
        
        return {
            priceToRentRatio: Math.round(priceToRentRatio * 100) / 100,
            capRate: Math.round(capRate * 100) / 100
        };
    }

    // Zillow-style property scraper (conceptual - would need real API/scraping)
    async scrapeZillowData(zipCode, limit = 50) {
        console.log(`Scraping Zillow data for zip code: ${zipCode}`);
        
        // This is a placeholder - in reality you'd use:
        // 1. Zillow API (if available)
        // 2. Web scraping with proper headers/delays
        // 3. Third-party real estate APIs (RentSpree, Bridge, etc.)
        
        // Simulated Zillow data structure
        const mockProperties = [];
        for (let i = 0; i < limit; i++) {
            const basePrice = 200000 + Math.random() * 800000;
            const sqft = 800 + Math.random() * 2500;
            const beds = Math.floor(Math.random() * 4) + 1;
            const baths = Math.floor(Math.random() * 3) + 1;
            
            mockProperties.push({
                external_id: `zillow_${zipCode}_${i + 1}`,
                address: `${1000 + i} Sample St`,
                city: 'Sample City',
                state: 'CA',
                zip_code: zipCode,
                latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
                longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
                property_type: this.normalizePropertyType(['Single Family', 'Condo', 'Townhouse'][Math.floor(Math.random() * 3)]),
                bedrooms: beds,
                bathrooms: baths,
                square_feet: Math.floor(sqft),
                year_built: 1950 + Math.floor(Math.random() * 73),
                list_price: Math.floor(basePrice),
                data_source: 'zillow',
                property_metadata: {
                    listing_url: `https://zillow.com/homedetails/sample-${i + 1}`,
                    photos: [`https://photos.zillow.com/sample-${i + 1}-1.jpg`],
                    description: `Beautiful ${beds} bed, ${baths} bath home in great neighborhood.`,
                    listing_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                }
            });
        }
        
        return mockProperties;
    }

    // Rental comps scraper (Rentometer-style)
    async scrapeRentalComps(zipCode, bedrooms = null, bathrooms = null) {
        console.log(`Scraping rental comps for zip code: ${zipCode}`);
        
        // Simulated rental comp data
        const mockRentals = [];
        for (let i = 0; i < 20; i++) {
            const beds = bedrooms || (Math.floor(Math.random() * 4) + 1);
            const baths = bathrooms || (Math.floor(Math.random() * 3) + 1);
            const baseRent = 1200 + (beds * 400) + (baths * 200) + Math.random() * 800;
            
            mockRentals.push({
                external_id: `rental_${zipCode}_${i + 1}`,
                address: `${2000 + i} Rental Ave`,
                city: 'Sample City',
                state: 'CA',
                zip_code: zipCode,
                latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
                longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
                bedrooms: beds,
                bathrooms: baths,
                square_feet: 800 + Math.random() * 1500,
                monthly_rent: Math.floor(baseRent),
                data_source: 'rentometer',
                listing_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                comp_metadata: {
                    listing_url: `https://rentometer.com/sample-${i + 1}`,
                    amenities: ['parking', 'laundry'].slice(0, Math.floor(Math.random() * 2) + 1)
                }
            });
        }
        
        return mockRentals;
    }

    // Estimate rent for a property based on comps
    async estimateRent(property) {
        try {
            const query = `
                SELECT AVG(monthly_rent) as avg_rent
                FROM rental_comps 
                WHERE zip_code = $1 
                AND bedrooms = $2 
                AND bathrooms BETWEEN $3 AND $4
                AND is_active = true
                AND created_at > NOW() - INTERVAL '90 days'
            `;
            
            const result = await this.db.query(query, [
                property.zip_code,
                property.bedrooms,
                property.bathrooms - 0.5,
                property.bathrooms + 0.5
            ]);
            
            if (result.rows[0]?.avg_rent) {
                return Math.floor(result.rows[0].avg_rent);
            }
            
            // Fallback: estimate based on sqft and bedroom count
            const estimatedRent = (property.square_feet * 1.2) + (property.bedrooms * 300) + 800;
            return Math.floor(estimatedRent);
            
        } catch (error) {
            console.error('Error estimating rent:', error);
            return null;
        }
    }

    // Insert property into database
    async insertProperty(propertyData) {
        try {
            // Normalize address
            const addressData = this.normalizeAddress(propertyData.address);
            
            // Convert prices to cents for storage
            const listPriceCents = propertyData.list_price * 100;
            const estimatedRentCents = propertyData.estimated_rent * 100;
            
            // Calculate metrics
            const metrics = this.calculateMetrics(listPriceCents, estimatedRentCents);
            
            const insertQuery = `
                INSERT INTO properties (
                    external_id, address, street_number, street_name, 
                    city, state, zip_code, latitude, longitude,
                    neighborhood, property_type, bedrooms, bathrooms, 
                    square_feet, year_built, list_price, estimated_rent,
                    price_to_rent_ratio, cap_rate, data_source, property_metadata
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                )
                ON CONFLICT (external_id) 
                DO UPDATE SET
                    list_price = EXCLUDED.list_price,
                    estimated_rent = EXCLUDED.estimated_rent,
                    price_to_rent_ratio = EXCLUDED.price_to_rent_ratio,
                    cap_rate = EXCLUDED.cap_rate,
                    last_updated = NOW()
                RETURNING id
            `;
            
            const result = await this.db.query(insertQuery, [
                propertyData.external_id,
                addressData.address,
                addressData.streetNumber,
                addressData.streetName,
                addressData.city,
                addressData.state,
                addressData.zipCode,
                propertyData.latitude,
                propertyData.longitude,
                propertyData.neighborhood || null,
                this.normalizePropertyType(propertyData.property_type),
                propertyData.bedrooms,
                propertyData.bathrooms,
                propertyData.square_feet,
                propertyData.year_built,
                listPriceCents,
                estimatedRentCents,
                metrics.priceToRentRatio,
                metrics.capRate,
                propertyData.data_source,
                JSON.stringify(propertyData.property_metadata || {})
            ]);
            
            return result.rows[0]?.id;
        } catch (error) {
            console.error('Error inserting property:', error);
            throw error;
        }
    }

    // Insert rental comp
    async insertRentalComp(compData) {
        try {
            const insertQuery = `
                INSERT INTO rental_comps (
                    external_id, address, city, state, zip_code,
                    latitude, longitude, bedrooms, bathrooms, 
                    square_feet, monthly_rent, data_source,
                    listing_date, comp_metadata
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
                ON CONFLICT (external_id) DO NOTHING
                RETURNING id
            `;
            
            const result = await this.db.query(insertQuery, [
                compData.external_id,
                compData.address,
                compData.city,
                compData.state,
                compData.zip_code,
                compData.latitude,
                compData.longitude,
                compData.bedrooms,
                compData.bathrooms,
                compData.square_feet,
                compData.monthly_rent * 100, // Convert to cents
                compData.data_source,
                compData.listing_date,
                JSON.stringify(compData.comp_metadata || {})
            ]);
            
            return result.rows[0]?.id;
        } catch (error) {
            console.error('Error inserting rental comp:', error);
            throw error;
        }
    }

    // Main ingestion process
    async ingestMarketData(zipCodes, options = {}) {
        const { propertiesPerZip = 50, includeRentals = true } = options;
        
        console.log(`Starting data ingestion for ${zipCodes.length} zip codes`);
        
        for (const zipCode of zipCodes) {
            try {
                console.log(`\nProcessing zip code: ${zipCode}`);
                
                // 1. Scrape property listings
                const properties = await this.scrapeZillowData(zipCode, propertiesPerZip);
                console.log(`Found ${properties.length} properties`);
                
                // 2. Scrape rental comps if requested
                let rentalComps = [];
                if (includeRentals) {
                    rentalComps = await this.scrapeRentalComps(zipCode);
                    console.log(`Found ${rentalComps.length} rental comps`);
                    
                    // Insert rental comps first
                    for (const comp of rentalComps) {
                        await this.insertRentalComp(comp);
                        await this.delay(100); // Brief delay
                    }
                }
                
                // 3. Process properties with rent estimates
                for (const property of properties) {
                    // Estimate rent if not provided
                    if (!property.estimated_rent) {
                        property.estimated_rent = await this.estimateRent(property);
                    }
                    
                    await this.insertProperty(property);
                    await this.delay(100); // Brief delay
                }
                
                console.log(`✓ Completed ${zipCode}: ${properties.length} properties, ${rentalComps.length} comps`);
                
                // Rate limiting between zip codes
                await this.delay(this.requestDelay);
                
            } catch (error) {
                console.error(`Error processing zip code ${zipCode}:`, error);
                continue;
            }
        }
        
        console.log('\n✓ Data ingestion completed');
    }

    // Cleanup and maintenance
    async cleanupOldData(daysOld = 90) {
        try {
            const result = await this.db.query(`
                UPDATE properties 
                SET is_active = false 
                WHERE last_updated < NOW() - INTERVAL '${daysOld} days'
                AND is_active = true
            `);
            
            console.log(`Deactivated ${result.rowCount} old properties`);
            return result.rowCount;
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            throw error;
        }
    }

    async close() {
        await this.db.end();
    }
}

// Export for use in other modules
module.exports = PropertyDataIngestion;

// Example usage
if (require.main === module) {
    async function main() {
        const ingestion = new PropertyDataIngestion();
        
        try {
            // Sample zip codes for testing
            const testZipCodes = ['90210', '10001', '60601', '30309', '78701'];
            
            await ingestion.ingestMarketData(testZipCodes, {
                propertiesPerZip: 25,
                includeRentals: true
            });
            
        } catch (error) {
            console.error('Ingestion failed:', error);
        } finally {
            await ingestion.close();
        }
    }
    
    main();
}
