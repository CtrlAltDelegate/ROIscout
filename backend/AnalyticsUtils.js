// Analytics Utilities and Helper Functions
// Supporting functions for property analysis and calculations

const { Pool } = require('pg');

class AnalyticsUtils {
    constructor(dbPool) {
        this.db = dbPool;
    }

    // Calculate investment metrics for a property
    calculateInvestmentMetrics(listPrice, monthlyRent, expenses = {}) {
        const {
            propertyTax = 0,
            insurance = 0,
            maintenance = monthlyRent * 0.1, // 10% of rent default
            vacancy = monthlyRent * 0.05, // 5% vacancy default
            management = monthlyRent * 0.08 // 8% management default
        } = expenses;

        const monthlyExpenses = propertyTax + insurance + maintenance + vacancy + management;
        const netMonthlyIncome = monthlyRent - monthlyExpenses;
        const annualNetIncome = netMonthlyIncome * 12;

        return {
            // Basic ratios
            priceToRentRatio: (monthlyRent / listPrice) * 100,
            grossRentMultiplier: listPrice / (monthlyRent * 12),
            
            // Cap rates
            grossCapRate: ((monthlyRent * 12) / listPrice) * 100,
            netCapRate: (annualNetIncome / listPrice) * 100,
            
            // Cash flow (assuming no financing)
            monthlyGrossCashFlow: monthlyRent,
            monthlyNetCashFlow: netMonthlyIncome,
            annualNetIncome: annualNetIncome,
            
            // Expense breakdown
            monthlyExpenses: {
                total: monthlyExpenses,
                propertyTax,
                insurance,
                maintenance,
                vacancy,
                management
            },
            
            // Performance indicators
            onePercentRule: (monthlyRent / listPrice) >= 0.01,
            twoPercentRule: (monthlyRent / listPrice) >= 0.02,
            fiftyPercentRule: monthlyExpenses <= (monthlyRent * 0.5)
        };
    }

    // Analyze property against market comparables
    async analyzeMarketPosition(propertyId) {
        try {
            const property = await this.db.query(`
                SELECT * FROM property_analytics WHERE id = $1
            `, [propertyId]);

            if (property.rows.length === 0) {
                throw new Error('Property not found');
            }

            const prop = property.rows[0];

            // Get market comparables
            const comps = await this.db.query(`
                SELECT 
                    price_to_rent_ratio,
                    list_price_dollars,
                    estimated_rent_dollars,
                    square_feet
                FROM property_analytics
                WHERE zip_code = $1
                AND bedrooms = $2
                AND bathrooms BETWEEN $3 AND $4
                AND id != $5
                AND price_to_rent_ratio IS NOT NULL
            `, [
                prop.zip_code,
                prop.bedrooms,
                prop.bathrooms - 0.5,
                prop.bathrooms + 0.5,
                propertyId
            ]);

            if (comps.rows.length < 3) {
                return {
                    property: prop,
                    market_analysis: 'Insufficient comparable properties for analysis',
                    comparables_count: comps.rows.length
                };
            }

            // Calculate market statistics
            const ratios = comps.rows.map(c => c.price_to_rent_ratio).sort((a, b) => a - b);
            const prices = comps.rows.map(c => c.list_price_dollars).sort((a, b) => a - b);
            const rents = comps.rows.map(c => c.estimated_rent_dollars).sort((a, b) => a - b);

            const marketStats = {
                ratio: {
                    median: this.calculateMedian(ratios),
                    average: ratios.reduce((a, b) => a + b, 0) / ratios.length,
                    percentile_25: this.calculatePercentile(ratios, 25),
                    percentile_75: this.calculatePercentile(ratios, 75)
                },
                price: {
                    median: this.calculateMedian(prices),
                    average: prices.reduce((a, b) => a + b, 0) / prices.length
                },
                rent: {
                    median: this.calculateMedian(rents),
                    average: rents.reduce((a, b) => a + b, 0) / rents.length
                }
            };

            // Analyze property position
            const analysis = {
                ratio_percentile: this.calculatePercentileRank(ratios, prop.price_to_rent_ratio),
                price_percentile: this.calculatePercentileRank(prices, prop.list_price_dollars),
                rent_percentile: this.calculatePercentileRank(rents, prop.estimated_rent_dollars),
                
                vs_market: {
                    ratio_difference: prop.price_to_rent_ratio - marketStats.ratio.median,
                    price_difference: prop.list_price_dollars - marketStats.price.median,
                    rent_difference: prop.estimated_rent_dollars - marketStats.rent.median
                },
                
                deal_quality: this.assessDealQuality(prop, marketStats),
                comparables_count: comps.rows.length
            };

            return {
                property: prop,
                market_stats: marketStats,
                analysis: analysis,
                comparables: comps.rows.slice(0, 10) // Return top 10 comps
            };

        } catch (error) {
            console.error('Market analysis error:', error);
            throw error;
        }
    }

    // Find anomalies and exceptional deals
    async findAnomalies(filters = {}) {
        try {
            const {
                zipCode,
                minImprovement = 15, // Minimum % better than market
                maxPrice,
                propertyType,
                minRatio = 1.0
            } = filters;

            let query = `
                WITH market_averages AS (
                    SELECT 
                        zip_code,
                        bedrooms,
                        AVG(price_to_rent_ratio) as avg_market_ratio,
                        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_to_rent_ratio) as median_market_ratio,
                        COUNT(*) as sample_size
                    FROM property_analytics
                    WHERE price_to_rent_ratio IS NOT NULL
                    GROUP BY zip_code, bedrooms
                    HAVING COUNT(*) >= 5
                ),
                anomaly_candidates AS (
                    SELECT 
                        p.*,
                        m.avg_market_ratio,
                        m.median_market_ratio,
                        m.sample_size,
                        ((p.price_to_rent_ratio / m.median_market_ratio) - 1) * 100 as improvement_percent,
                        p.price_to_rent_ratio - m.median_market_ratio as ratio_difference
                    FROM property_analytics p
                    JOIN market_averages m ON p.zip_code = m.zip_code AND p.bedrooms = m.bedrooms
                    WHERE p.price_to_rent_ratio >= $1
                )
                SELECT *
                FROM anomaly_candidates
                WHERE improvement_percent >= $2
            `;

            const params = [minRatio, minImprovement];
            let paramCount = 2;

            if (zipCode) {
                query += ` AND zip_code = ${++paramCount}`;
                params.push(zipCode);
            }

            if (maxPrice) {
                query += ` AND list_price_dollars <= ${++paramCount}`;
                params.push(maxPrice);
            }

            if (propertyType) {
                query += ` AND property_type = ${++paramCount}`;
                params.push(propertyType);
            }

            query += ` ORDER BY improvement_percent DESC LIMIT 50`;

            const result = await this.db.query(query, params);

            return {
                anomalies: result.rows,
                criteria: {
                    min_improvement_percent: minImprovement,
                    min_ratio: minRatio,
                    filters_applied: Object.keys(filters).length
                },
                summary: {
                    total_found: result.rows.length,
                    avg_improvement: result.rows.length > 0 
                        ? result.rows.reduce((sum, r) => sum + r.improvement_percent, 0) / result.rows.length 
                        : 0,
                    best_deal: result.rows[0] || null
                }
            };

        } catch (error) {
            console.error('Anomaly detection error:', error);
            throw error;
        }
    }

    // Calculate market trends and insights
    async calculateMarketTrends(timeframe = '30 days') {
        try {
            const query = `
                SELECT 
                    zip_code,
                    state,
                    DATE_TRUNC('week', created_at) as week,
                    COUNT(*) as new_listings,
                    AVG(price_to_rent_ratio) as avg_ratio,
                    AVG(list_price_dollars) as avg_price,
                    AVG(estimated_rent_dollars) as avg_rent
                FROM property_analytics
                WHERE created_at >= NOW() - INTERVAL '${timeframe}'
                AND price_to_rent_ratio IS NOT NULL
                GROUP BY zip_code, state, week
                HAVING COUNT(*) >= 3
                ORDER BY week DESC, avg_ratio DESC
            `;

            const result = await this.db.query(query);

            // Group by zip code and calculate trends
            const trendsByZip = {};
            result.rows.forEach(row => {
                if (!trendsByZip[row.zip_code]) {
                    trendsByZip[row.zip_code] = {
                        zip_code: row.zip_code,
                        state: row.state,
                        weeks: []
                    };
                }
                trendsByZip[row.zip_code].weeks.push({
                    week: row.week,
                    new_listings: parseInt(row.new_listings),
                    avg_ratio: parseFloat(row.avg_ratio),
                    avg_price: parseFloat(row.avg_price),
                    avg_rent: parseFloat(row.avg_rent)
                });
            });

            // Calculate trend direction for each zip code
            const trendsWithDirection = Object.values(trendsByZip).map(zipData => {
                const weeks = zipData.weeks.sort((a, b) => new Date(a.week) - new Date(b.week));
                
                if (weeks.length < 2) return { ...zipData, trend: 'insufficient_data' };

                const firstWeek = weeks[0];
                const lastWeek = weeks[weeks.length - 1];
                
                const ratioChange = ((lastWeek.avg_ratio - firstWeek.avg_ratio) / firstWeek.avg_ratio) * 100;
                const priceChange = ((lastWeek.avg_price - firstWeek.avg_price) / firstWeek.avg_price) * 100;

                return {
                    ...zipData,
                    trend: {
                        ratio_change_percent: ratioChange,
                        price_change_percent: priceChange,
                        direction: ratioChange > 5 ? 'improving' : ratioChange < -5 ? 'declining' : 'stable',
                        total_new_listings: weeks.reduce((sum, w) => sum + w.new_listings, 0),
                        weeks_analyzed: weeks.length
                    }
                };
            });

            return {
                timeframe,
                trends_by_market: trendsWithDirection.sort((a, b) => 
                    (b.trend.ratio_change_percent || 0) - (a.trend.ratio_change_percent || 0)
                ),
                summary: {
                    improving_markets: trendsWithDirection.filter(t => t.trend.direction === 'improving').length,
                    declining_markets: trendsWithDirection.filter(t => t.trend.direction === 'declining').length,
                    stable_markets: trendsWithDirection.filter(t => t.trend.direction === 'stable').length
                }
            };

        } catch (error) {
            console.error('Market trends error:', error);
            throw error;
        }
    }

    // Advanced property scoring system
    scoreProperty(property, marketStats = null) {
        let score = 0;
        const factors = [];

        // Price-to-rent ratio scoring (40% weight)
        if (property.price_to_rent_ratio) {
            if (property.price_to_rent_ratio >= 2.0) {
                score += 40;
                factors.push({ factor: 'Excellent rent ratio (≥2%)', points: 40 });
            } else if (property.price_to_rent_ratio >= 1.5) {
                score += 30;
                factors.push({ factor: 'Good rent ratio (≥1.5%)', points: 30 });
            } else if (property.price_to_rent_ratio >= 1.0) {
                score += 20;
                factors.push({ factor: 'Fair rent ratio (≥1%)', points: 20 });
            } else {
                score += 5;
                factors.push({ factor: 'Low rent ratio (<1%)', points: 5 });
            }
        }

        // Market position scoring (30% weight)
        if (marketStats && property.ratio_vs_market_percent) {
            if (property.ratio_vs_market_percent >= 25) {
                score += 30;
                factors.push({ factor: 'Significantly above market (≥25%)', points: 30 });
            } else if (property.ratio_vs_market_percent >= 15) {
                score += 25;
                factors.push({ factor: 'Well above market (≥15%)', points: 25 });
            } else if (property.ratio_vs_market_percent >= 5) {
                score += 15;
                factors.push({ factor: 'Above market (≥5%)', points: 15 });
            } else if (property.ratio_vs_market_percent >= -5) {
                score += 10;
                factors.push({ factor: 'At market level', points: 10 });
            } else {
                score += 2;
                factors.push({ factor: 'Below market', points: 2 });
            }
        }

        // Cap rate scoring (20% weight)
        if (property.cap_rate) {
            if (property.cap_rate >= 10) {
                score += 20;
                factors.push({ factor: 'Excellent cap rate (≥10%)', points: 20 });
            } else if (property.cap_rate >= 8) {
                score += 15;
                factors.push({ factor: 'Good cap rate (≥8%)', points: 15 });
            } else if (property.cap_rate >= 6) {
                score += 10;
                factors.push({ factor: 'Fair cap rate (≥6%)', points: 10 });
            } else {
                score += 3;
                factors.push({ factor: 'Low cap rate (<6%)', points: 3 });
            }
        }

        // Property characteristics (10% weight)
        if (property.square_feet && property.bedrooms) {
            const sqftPerBedroom = property.square_feet / property.bedrooms;
            if (sqftPerBedroom >= 500) {
                score += 10;
                factors.push({ factor: 'Good space per bedroom', points: 10 });
            } else if (sqftPerBedroom >= 300) {
                score += 5;
                factors.push({ factor: 'Adequate space per bedroom', points: 5 });
            } else {
                score += 1;
                factors.push({ factor: 'Limited space per bedroom', points: 1 });
            }
        }

        // Determine grade
        let grade;
        if (score >= 85) grade = 'A+';
        else if (score >= 75) grade = 'A';
        else if (score >= 65) grade = 'B+';
        else if (score >= 55) grade = 'B';
        else if (score >= 45) grade = 'C+';
        else if (score >= 35) grade = 'C';
        else if (score >= 25) grade = 'D';
        else grade = 'F';

        return {
            total_score: score,
            grade,
            factors,
            recommendation: this.getRecommendation(score, grade)
        };
    }

    // Generate investment recommendation
    getRecommendation(score, grade) {
        if (score >= 75) {
            return {
                action: 'strong_buy',
                message: 'Excellent investment opportunity with strong fundamentals',
                confidence: 'high'
            };
        } else if (score >= 55) {
            return {
                action: 'buy',
                message: 'Good investment potential, worth pursuing',
                confidence: 'medium-high'
            };
        } else if (score >= 35) {
            return {
                action: 'consider',
                message: 'Average opportunity, investigate further',
                confidence: 'medium'
            };
        } else {
            return {
                action: 'pass',
                message: 'Below-average investment metrics',
                confidence: 'low'
            };
        }
    }

    // Statistical utility functions
    calculateMedian(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
    }

    calculatePercentile(arr, percentile) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    calculatePercentileRank(arr, value) {
        const sorted = [...arr].sort((a, b) => a - b);
        const count = sorted.filter(v => v <= value).length;
        return (count / sorted.length) * 100;
    }

    assessDealQuality(property, marketStats) {
        const score = this.scoreProperty(property, marketStats);
        
        if (property.price_to_rent_ratio >= marketStats.ratio.percentile_75) {
            return 'excellent';
        } else if (property.price_to_rent_ratio >= marketStats.ratio.median) {
            return 'good';
        } else if (property.price_to_rent_ratio >= marketStats.ratio.percentile_25) {
            return 'fair';
        } else {
            return 'poor';
        }
    }

    // Distance calculation for geographic analysis
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Generate comprehensive property report
    async generatePropertyReport(propertyId) {
        try {
            // Get property details
            const property = await this.db.query(`
                SELECT * FROM property_analytics WHERE id = $1
            `, [propertyId]);

            if (property.rows.length === 0) {
                throw new Error('Property not found');
            }

            const prop = property.rows[0];

            // Get market analysis
            const marketAnalysis = await this.analyzeMarketPosition(propertyId);
            
            // Score the property
            const score = this.scoreProperty(prop, marketAnalysis.market_stats);
            
            // Calculate investment metrics
            const metrics = this.calculateInvestmentMetrics(
                prop.list_price_dollars,
                prop.estimated_rent_dollars
            );

            return {
                property: prop,
                market_analysis: marketAnalysis,
                investment_metrics: metrics,
                score_analysis: score,
                generated_at: new Date().toISOString(),
                report_version: '1.0'
            };

        } catch (error) {
            console.error('Property report generation error:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsUtils;
