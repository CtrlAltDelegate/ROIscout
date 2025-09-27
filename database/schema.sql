-- ROIscout Property Database Schema
-- PostgreSQL with UUID support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties table - core property data
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE, -- Zillow/MLS ID
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
    property_type VARCHAR(50), -- single_family, condo, townhouse, multi_family
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    lot_size_sqft INTEGER,
    year_built INTEGER,
    
    -- Financial data
    list_price INTEGER, -- in cents to avoid decimal issues
    estimated_rent INTEGER, -- monthly rent estimate in cents
    price_per_sqft INTEGER, -- in cents
    
    -- Calculated metrics
    price_to_rent_ratio DECIMAL(6,2), -- monthly rent / purchase price * 100
    cap_rate DECIMAL(5,2), -- annual rent / purchase price * 100
    
    -- Metadata
    data_source VARCHAR(50), -- zillow, redfin, mls, manual
    property_metadata JSONB, -- flexible storage for source-specific data
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    listing_status VARCHAR(50) DEFAULT 'active' -- active, pending, sold, off_market
);

-- Rental comparables table
CREATE TABLE rental_comps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    external_id VARCHAR(100), -- Rentometer, Craigslist, etc. ID
    
    -- Location (for comps that don't match exact properties)
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
    monthly_rent INTEGER, -- in cents
    
    -- Metadata
    data_source VARCHAR(50), -- rentometer, craigslist, apartments_com, manual
    listing_date DATE,
    comp_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    is_active BOOLEAN DEFAULT true
);

-- Property amenities and features
CREATE TABLE property_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    amenity_type VARCHAR(100), -- parking, pool, gym, etc.
    amenity_value VARCHAR(200), -- garage_2_car, heated_pool, etc.
    distance_miles DECIMAL(5,2), -- for nearby amenities
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data for neighborhoods/zip codes
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_type VARCHAR(20), -- zip_code, neighborhood, county
    area_value VARCHAR(100), -- "90210", "Beverly Hills", etc.
    
    -- Market metrics
    median_home_price INTEGER,
    median_rent INTEGER,
    average_price_to_rent_ratio DECIMAL(6,2),
    total_listings INTEGER,
    average_days_on_market INTEGER,
    
    -- Time period
    data_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites/saved searches (for later)
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- will reference users table when auth is built
    property_id UUID REFERENCES properties(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_properties_location ON properties (latitude, longitude);
CREATE INDEX idx_properties_zip ON properties (zip_code);
CREATE INDEX idx_properties_price_range ON properties (list_price);
CREATE INDEX idx_properties_ratio ON properties (price_to_rent_ratio);
CREATE INDEX idx_properties_updated ON properties (last_updated);
CREATE INDEX idx_rental_comps_location ON rental_comps (latitude, longitude);
CREATE INDEX idx_market_data_area ON market_data (area_type, area_value, data_date);

-- GIN index for JSONB metadata searches
CREATE INDEX idx_properties_metadata ON properties USING GIN (property_metadata);
CREATE INDEX idx_rental_comps_metadata ON rental_comps USING GIN (comp_metadata);

-- View for property analytics
CREATE VIEW property_analytics AS
SELECT 
    p.id,
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
    
    -- Market comparison (vs neighborhood average)
    CASE 
        WHEN md.average_price_to_rent_ratio > 0 THEN
            ROUND((p.price_to_rent_ratio / md.average_price_to_rent_ratio - 1) * 100, 1)
        ELSE NULL
    END as ratio_vs_market_percent,
    
    p.latitude,
    p.longitude,
    p.last_updated
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
