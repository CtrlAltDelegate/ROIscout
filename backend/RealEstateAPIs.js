// Real Estate API Integration Module
// Handles various real estate data sources with proper API calls

const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

class RealEstateAPIs {
    constructor() {
        // API credentials from environment
        this.rentspreeKey = process.env.RENTSPREE_API_KEY;
        this.bridgeKey = process.env.BRIDGE_API_KEY;
        this.realtorKey = process.env.REALTOR_API_KEY;
        this.rentometerKey = process.env.RENTOMETER_API_KEY;
        
        // Rate limiting
        this.requestDelay = 1500;
        this.lastRequestTime = 0;
    }

    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelay) {
            await new Promise(resolve => 
                setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
            );
        }
        this.lastRequestTime = Date.now();
    }

    // Realtor.com API integration (RapidAPI)
    async getRealtorProperties(zipCode, limit = 50) {
        await this.rateLimitDelay();
        
        try {
            const options = {
                method: 'GET',
                url: 'https://realtor.p.rapidapi.com/properties/v2/list-for-sale',
                params: {
                    postal_code: zipCode,
                    limit: limit,
                    offset: 0,
                    sort: 'relevance'
                },
                headers: {
                    'X-RapidAPI-Key': this.realtorKey,
                    'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
                }
            };

            const response = await axios.request(options);
            
            if (response.data?.properties) {
                return response.data.properties.map(prop => ({
                    external_id: `realtor_${prop.property_id}`,
                    address: prop.address?.line || '',
                    city: prop.address?.city || '',
                    state: prop.address?.state_code || '',
                    zip_code: prop.address?.postal_code || zipCode,
                    latitude: prop.address?.lat,
                    longitude: prop.address?.lon,
                    property_type: this.normalizePropertyType(prop.prop_type),
                    bedrooms: prop.beds,
                    bathrooms: prop.baths,
                    square_feet: prop.building_size?.size,
                    year_built: prop.year_built,
                    list_price: prop.price,
                    data_source: 'realtor',
                    property_metadata: {
                        listing_id: prop.property_id,
                        mls_id: prop.mls?.id,
                        listing_url: prop.rdc_web_url,
                        photos: prop.photos?.map(photo => photo.href) || [],
                        description: prop.description,
                        listing_date: prop.list_date,
                        days_on_market: prop.days_on_market,
                        price_per_sqft: prop.price_per_sqft
                    }
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Realtor API error:', error.response?.data || error.message);
            return [];
        }
    }

    // RentSpree API for rental data
    async getRentspreeData(zipCode, bedrooms = null) {
        await this.rateLimitDelay();
        
        try {
            const params = {
                zip_code: zipCode,
                limit: 50
            };
            
            if (bedrooms) params.bedrooms = bedrooms;

            const response = await axios.get('https://api.rentspree.com/v1/listings', {
                params,
                headers: {
                    'Authorization': `Bearer ${this.rentspreeKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.listings) {
                return response.data.listings.map(listing => ({
                    external_id: `rentspree_${listing.id}`,
                    address: listing.address?.full_address || '',
                    city: listing.address?.city || '',
                    state: listing.address?.state || '',
                    zip_code: listing.address?.zip_code || zipCode,
                    latitude: listing.address?.latitude,
                    longitude: listing.address?.longitude,
                    bedrooms: listing.bedrooms,
                    bathrooms: listing.bathrooms,
                    square_feet: listing.square_feet,
                    monthly_rent: listing.rent,
                    data_source: 'rentspree',
                    listing_date: listing.available_date,
                    comp_metadata: {
                        listing_id: listing.id,
                        listing_url: listing.listing_url,
                        photos: listing.photos || [],
                        amenities: listing.amenities || [],
                        pet_policy: listing.pet_policy
                    }
                }));
            }
            
            return [];
        } catch (error) {
            console.error('RentSpree API error:', error.response?.data || error.message);
            return [];
        }
    }

    // Rentometer API integration
    async getRentometerData(zipCode, bedrooms = null, bathrooms = null) {
        await this.rateLimitDelay();
        
        try {
            const params = {
                zip: zipCode
            };
            
            if (bedrooms) params.bedrooms = bedrooms;
            if (bathrooms) params.bathrooms = bathrooms;

            const response = await axios.get('https://api.rentometer.com/v1/summary', {
                params,
                headers: {
                    'X-API-Key': this.rentometerKey
                }
            });

            if (response.data?.rentometer) {
                const data = response.data.rentometer;
                return {
                    zip_code: zipCode,
                    bedrooms: bedrooms,
                    bathrooms: bathrooms,
                    median_rent: data.median_rent,
                    average_rent: data.average_rent,
                    sample_size: data.sample_size,
                    data_source: 'rentometer',
                    metadata: {
                        percentile_25: data.percentile_25,
                        percentile_75: data.percentile_75,
                        confidence_score: data.confidence_score
                    }
                };
            }
            
            return null;
        } catch (error) {
            console.error('Rentometer API error:', error.response?.data || error.message);
            return null;
        }
    }

    // Bridge Interactive API for MLS data
    async getBridgeMLSData(zipCode, limit = 50) {
        await this.rateLimitDelay();
        
        try {
            const response = await axios.get('https://api.bridgeinteractive.com/v2/listings', {
                params: {
                    postal_code: zipCode,
                    status: 'active',
                    limit: limit
                },
                headers: {
                    'Authorization': `Bearer ${this.bridgeKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.listings) {
                return response.data.listings.map(listing => ({
                    external_id: `bridge_${listing.mls_number}`,
                    address: listing.address?.unparsed_address || '',
                    city: listing.address?.city || '',
                    state: listing.address?.state_or_province || '',
                    zip_code: listing.address?.postal_code || zipCode,
                    latitude: listing.geo?.latitude,
                    longitude: listing.geo?.longitude,
                    neighborhood: listing.location?.neighborhood,
                    school_district: listing.location?.school_district,
                    property_type: this.normalizePropertyType(listing.property?.property_type),
                    bedrooms: listing.property?.bedrooms_total,
                    bathrooms: listing.property?.bathrooms_total,
                    square_feet: listing.property?.living_area,
                    lot_size_sqft: listing.property?.lot_size_area,
                    year_built: listing.property?.year_built,
                    list_price: listing.price?.list_price,
                    data_source: 'bridge_mls',
                    property_metadata: {
                        mls_number: listing.mls_number,
                        listing_id: listing.listing_id,
                        list_date: listing.dates?.list_date,
                        days_on_market: listing.dates?.days_on_market,
                        photos: listing.photos?.map(photo => photo.url) || [],
                        description: listing.remarks?.public_remarks,
                        garage_spaces: listing.property?.garage_spaces,
                        parking_total: listing.property?.parking_total
                    }
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Bridge MLS API error:', error.response?.data || error.message);
            return [];
        }
    }

    // Apartments.com scraper (since they don't have a public API)
    async scrapeApartmentsDotCom(zipCode) {
        await this.rateLimitDelay();
        
        try {
            const url = `https://www.apartments.com/${zipCode}/`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const listings = [];

            $('.placard').each((index, element) => {
                const $el = $(element);
                const address = $el.find('.property-address').text().trim();
                const priceText = $el.find('.property-pricing').text().trim();
                const bedsText = $el.find('.property-beds').text().trim();
                
                // Extract price (handle ranges like "$1,200 - $1,800")
                const priceMatch = priceText.match(/\$?([\d,]+)/);
                const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;
                
                // Extract bedrooms
                const bedsMatch = bedsText.match(/(\d+)\s*bed/i);
                const bedrooms = bedsMatch ? parseInt(bedsMatch[1]) : null;
                
                if (address && price) {
                    listings.push({
                        external_id: `apartments_com_${zipCode}_${index}`,
                        address: address,
                        city: '', // Would need to parse from address
                        state: '',
                        zip_code: zipCode,
                        bedrooms: bedrooms,
                        bathrooms: null, // Not always available
                        monthly_rent: price,
                        data_source: 'apartments_com',
                        comp_metadata: {
                            listing_url: $el.find('a').attr('href'),
                            property_name: $el.find('.property-title').text().trim()
                        }
                    });
                }
            });

            return listings;
        } catch (error) {
            console.error('Apartments.com scraping error:', error.message);
            return [];
        }
    }

    // Craigslist rental scraper
    async scrapeCraigslistRentals(city, state, zipCode) {
        await this.rateLimitDelay();
        
        try {
            const cityCode = city.toLowerCase().replace(/\s+/g, '');
            const url = `https://${cityCode}.craigslist.org/search/apa?postal=${zipCode}&search_distance=5`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const listings = [];

            $('.result-row').slice(0, 20).each((index, element) => {
                const $el = $(element);
                const title = $el.find('.result-title').text().trim();
                const priceText = $el.find('.result-price').text().trim();
                const location = $el.find('.result-hood').text().trim();
                const housing = $el.find('.housing').text().trim();
                
                // Extract price
                const priceMatch = priceText.match(/\$(\d+)/);
                const price = priceMatch ? parseInt(priceMatch[1]) : null;
                
                // Extract bedrooms/bathrooms from housing info
                const bedsMatch = housing.match(/(\d+)br/);
                const bathsMatch = housing.match(/(\d+(?:\.\d+)?)ba/);
                const sqftMatch = housing.match(/(\d+)ft/);
                
                if (title && price) {
                    listings.push({
                        external_id: `craigslist_${zipCode}_${Date.now()}_${index}`,
                        address: location.replace(/[()]/g, '').trim(),
                        city: city,
                        state: state,
                        zip_code: zipCode,
                        bedrooms: bedsMatch ? parseInt(bedsMatch[1]) : null,
                        bathrooms: bathsMatch ? parseFloat(bathsMatch[1]) : null,
                        square_feet: sqftMatch ? parseInt(sqftMatch[1]) : null,
                        monthly_rent: price,
                        data_source: 'craigslist',
                        listing_date: new Date().toISOString().split('T')[0],
                        comp_metadata: {
                            title: title,
                            listing_url: 'https://' + cityCode + '.craigslist.org' + $el.find('a').attr('href'),
                            housing_info: housing
                        }
                    });
                }
            });

            return listings;
        } catch (error) {
            console.error('Craigslist scraping error:', error.message);
            return [];
        }
    }

    // Utility method to normalize property types
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

    // Comprehensive data gathering for a zip code
    async gatherAllData(zipCode, options = {}) {
        const {
            includeRealtor = true,
            includeBridge = true,
            includeRentals = true,
            includeApartments = true,
            includeCraigslist = false, // More risky due to scraping
            city = null,
            state = null
        } = options;

        console.log(`Gathering comprehensive data for zip code: ${zipCode}`);
        const results = {
            properties: [],
            rentals: [],
            market_data: {},
            errors: []
        };

        // Gather property listings
        if (includeRealtor && this.realtorKey) {
            try {
                console.log('Fetching Realtor.com data...');
                const realtorProps = await this.getRealtorProperties(zipCode);
                results.properties.push(...realtorProps);
                console.log(`✓ Realtor.com: ${realtorProps.length} properties`);
            } catch (error) {
                results.errors.push(`Realtor.com error: ${error.message}`);
            }
        }

        if (includeBridge && this.bridgeKey) {
            try {
                console.log('Fetching Bridge MLS data...');
                const bridgeProps = await this.getBridgeMLSData(zipCode);
                results.properties.push(...bridgeProps);
                console.log(`✓ Bridge MLS: ${bridgeProps.length} properties`);
            } catch (error) {
                results.errors.push(`Bridge MLS error: ${error.message}`);
            }
        }

        // Gather rental data
        if (includeRentals && this.rentspreeKey) {
            try {
                console.log('Fetching RentSpree data...');
                const rentspreeData = await this.getRentspreeData(zipCode);
                results.rentals.push(...rentspreeData);
                console.log(`✓ RentSpree: ${rentspreeData.length} rentals`);
            } catch (error) {
                results.errors.push(`RentSpree error: ${error.message}`);
            }
        }

        if (includeApartments) {
            try {
                console.log('Scraping Apartments.com...');
                const apartmentData = await this.scrapeApartmentsDotCom(zipCode);
                results.rentals.push(...apartmentData);
                console.log(`✓ Apartments.com: ${apartmentData.length} rentals`);
            } catch (error) {
                results.errors.push(`Apartments.com error: ${error.message}`);
            }
        }

        if (includeCraigslist && city && state) {
            try {
                console.log('Scraping Craigslist...');
                const craigslistData = await this.scrapeCraigslistRentals(city, state, zipCode);
                results.rentals.push(...craigslistData);
                console.log(`✓ Craigslist: ${craigslistData.length} rentals`);
            } catch (error) {
                results.errors.push(`Craigslist error: ${error.message}`);
            }
        }

        // Get market summary data
        if (this.rentometerKey) {
            try {
                console.log('Fetching Rentometer market data...');
                for (let beds = 1; beds <= 4; beds++) {
                    const marketData = await this.getRentometerData(zipCode, beds);
                    if (marketData) {
                        results.market_data[`${beds}br`] = marketData;
                    }
                }
                console.log(`✓ Rentometer: Market data for ${Object.keys(results.market_data).length} bedroom counts`);
            } catch (error) {
                results.errors.push(`Rentometer error: ${error.message}`);
            }
        }

        // Log summary
        console.log(`\n📊 Data Summary for ${zipCode}:`);
        console.log(`   Properties: ${results.properties.length}`);
        console.log(`   Rentals: ${results.rentals.length}`);
        console.log(`   Market Data: ${Object.keys(results.market_data).length} bedroom types`);
        if (results.errors.length > 0) {
            console.log(`   Errors: ${results.errors.length}`);
            results.errors.forEach(error => console.log(`     - ${error}`));
        }

        return results;
    }

    // Estimate rent using multiple sources
    async estimateRentMultiSource(property) {
        const estimates = [];
        
        // Try Rentometer first
        if (this.rentometerKey) {
            try {
                const rentometerData = await this.getRentometerData(
                    property.zip_code, 
                    property.bedrooms, 
                    property.bathrooms
                );
                if (rentometerData?.median_rent) {
                    estimates.push({
                        source: 'rentometer',
                        estimate: rentometerData.median_rent,
                        confidence: rentometerData.metadata?.confidence_score || 0.5
                    });
                }
            } catch (error) {
                console.error('Rentometer estimate error:', error.message);
            }
        }

        // Try RentSpree
        if (this.rentspreeKey) {
            try {
                const rentspreeData = await this.getRentspreeData(property.zip_code, property.bedrooms);
                if (rentspreeData.length > 0) {
                    const avgRent = rentspreeData.reduce((sum, rental) => sum + rental.monthly_rent, 0) / rentspreeData.length;
                    estimates.push({
                        source: 'rentspree',
                        estimate: avgRent,
                        confidence: Math.min(rentspreeData.length / 10, 1) // More samples = higher confidence
                    });
                }
            } catch (error) {
                console.error('RentSpree estimate error:', error.message);
            }
        }

        // Calculate weighted average
        if (estimates.length > 0) {
            const totalWeight = estimates.reduce((sum, est) => sum + est.confidence, 0);
            const weightedSum = estimates.reduce((sum, est) => sum + (est.estimate * est.confidence), 0);
            
            return {
                estimated_rent: Math.round(weightedSum / totalWeight),
                confidence: totalWeight / estimates.length,
                sources: estimates.map(est => est.source),
                individual_estimates: estimates
            };
        }

        // Fallback calculation
        const fallbackRent = (property.square_feet * 1.2) + (property.bedrooms * 350) + 800;
        return {
            estimated_rent: Math.round(fallbackRent),
            confidence: 0.3,
            sources: ['fallback'],
            individual_estimates: []
        };
    }
}

module.exports = RealEstateAPIs;

// Example usage and testing
if (require.main === module) {
    async function testAPIs() {
        const apis = new RealEstateAPIs();
        
        try {
            // Test with a sample zip code
            const testZip = '90210';
            const results = await apis.gatherAllData(testZip, {
                city: 'Beverly Hills',
                state: 'CA',
                includeCraigslist: false // Disable for testing
            });
            
            console.log('\n📋 Test Results:');
            console.log(JSON.stringify(results, null, 2));
            
        } catch (error) {
            console.error('Test failed:', error);
        }
    }
    
    // Uncomment to run tests
    // testAPIs();
}
