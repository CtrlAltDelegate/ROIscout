import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  MapPin,
  DollarSign,
  Home,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const HistoricalTrends = () => {
  const [selectedMarket, setSelectedMarket] = useState('indianapolis');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5y');
  const [selectedMetric, setSelectedMetric] = useState('both');
  const [loading, setLoading] = useState(false);

  // Mock historical data - in real app, this would come from API
  const [trendData, setTrendData] = useState({
    priceData: [],
    rentData: [],
    ratioData: [],
    marketStats: {}
  });

  const markets = [
    { id: 'indianapolis', name: 'Indianapolis, IN', avgPrice: 185000, avgRent: 1450 },
    { id: 'kansas-city', name: 'Kansas City, MO', avgPrice: 165000, avgRent: 1320 },
    { id: 'nashville', name: 'Nashville, TN', avgPrice: 285000, avgRent: 1850 },
    { id: 'atlanta', name: 'Atlanta, GA', avgPrice: 245000, avgRent: 1650 },
    { id: 'phoenix', name: 'Phoenix, AZ', avgPrice: 325000, avgRent: 1950 }
  ];

  const timeframes = [
    { id: '1y', name: '1 Year', months: 12 },
    { id: '3y', name: '3 Years', months: 36 },
    { id: '5y', name: '5 Years', months: 60 },
    { id: '10y', name: '10 Years', months: 120 }
  ];

  useEffect(() => {
    generateMockData();
  }, [selectedMarket, selectedTimeframe]);

  const generateMockData = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const market = markets.find(m => m.id === selectedMarket);
      const timeframe = timeframes.find(t => t.id === selectedTimeframe);
      const months = timeframe.months;
      
      const priceData = [];
      const rentData = [];
      const ratioData = [];
      
      let currentPrice = market.avgPrice * 0.8; // Start 20% lower
      let currentRent = market.avgRent * 0.9; // Start 10% lower
      
      // Generate monthly data points
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - i));
        
        // Add some realistic volatility
        const priceGrowth = 0.003 + (Math.random() - 0.5) * 0.002; // ~3.6% annual with volatility
        const rentGrowth = 0.002 + (Math.random() - 0.5) * 0.001; // ~2.4% annual with volatility
        
        currentPrice *= (1 + priceGrowth);
        currentRent *= (1 + rentGrowth);
        
        const ratio = (currentRent * 12 / currentPrice) * 100;
        
        priceData.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(currentPrice),
          change: i > 0 ? ((currentPrice / priceData[i-1]?.value - 1) * 100) : 0
        });
        
        rentData.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(currentRent),
          change: i > 0 ? ((currentRent / rentData[i-1]?.value - 1) * 100) : 0
        });
        
        ratioData.push({
          date: date.toISOString().split('T')[0],
          value: ratio,
          change: i > 0 ? (ratio - ratioData[i-1]?.value) : 0
        });
      }
      
      // Calculate market stats
      const priceChange = ((priceData[priceData.length - 1].value / priceData[0].value - 1) * 100);
      const rentChange = ((rentData[rentData.length - 1].value / rentData[0].value - 1) * 100);
      const currentRatio = ratioData[ratioData.length - 1].value;
      const ratioChange = ratioData[ratioData.length - 1].value - ratioData[0].value;
      
      setTrendData({
        priceData,
        rentData,
        ratioData,
        marketStats: {
          priceChange,
          rentChange,
          currentRatio,
          ratioChange,
          currentPrice: priceData[priceData.length - 1].value,
          currentRent: rentData[rentData.length - 1].value
        }
      });
      
      setLoading(false);
    }, 800);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return BarChart3;
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Price', 'Rent', 'Rent-to-Price Ratio'],
      ...trendData.priceData.map((item, index) => [
        item.date,
        item.value,
        trendData.rentData[index].value,
        trendData.ratioData[index].value.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMarket}-trends-${selectedTimeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historical Market Trends</h1>
              <p className="text-gray-600 mt-1">Analyze rent and price trends over time</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generateMockData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {timeframes.map(timeframe => (
                <option key={timeframe.id} value={timeframe.id}>
                  {timeframe.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Display
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="both">Prices & Rents</option>
              <option value="prices">Prices Only</option>
              <option value="rents">Rents Only</option>
              <option value="ratio">Rent-to-Price Ratio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Market Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Current Price</div>
            <Home className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(trendData.marketStats.currentPrice || 0)}
          </div>
          <div className={`text-sm flex items-center ${getChangeColor(trendData.marketStats.priceChange || 0)}`}>
            {React.createElement(getChangeIcon(trendData.marketStats.priceChange || 0), { className: "w-3 h-3 mr-1" })}
            {formatPercent(trendData.marketStats.priceChange || 0)} ({selectedTimeframe})
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Current Rent</div>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(trendData.marketStats.currentRent || 0)}
          </div>
          <div className={`text-sm flex items-center ${getChangeColor(trendData.marketStats.rentChange || 0)}`}>
            {React.createElement(getChangeIcon(trendData.marketStats.rentChange || 0), { className: "w-3 h-3 mr-1" })}
            {formatPercent(trendData.marketStats.rentChange || 0)} ({selectedTimeframe})
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Rent-to-Price Ratio</div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(trendData.marketStats.currentRatio || 0).toFixed(1)}%
          </div>
          <div className={`text-sm flex items-center ${getChangeColor(trendData.marketStats.ratioChange || 0)}`}>
            {React.createElement(getChangeIcon(trendData.marketStats.ratioChange || 0), { className: "w-3 h-3 mr-1" })}
            {(trendData.marketStats.ratioChange || 0) >= 0 ? '+' : ''}{(trendData.marketStats.ratioChange || 0).toFixed(1)}% ({selectedTimeframe})
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Investment Grade</div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(trendData.marketStats.currentRatio || 0) >= 8 ? 'A' : 
             (trendData.marketStats.currentRatio || 0) >= 6 ? 'B' : 
             (trendData.marketStats.currentRatio || 0) >= 4 ? 'C' : 'D'}
          </div>
          <div className="text-sm text-gray-600">
            {(trendData.marketStats.currentRatio || 0) >= 8 ? 'Excellent' : 
             (trendData.marketStats.currentRatio || 0) >= 6 ? 'Good' : 
             (trendData.marketStats.currentRatio || 0) >= 4 ? 'Fair' : 'Poor'}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {markets.find(m => m.id === selectedMarket)?.name} - {timeframes.find(t => t.id === selectedTimeframe)?.name} Trends
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            {selectedMetric === 'both' || selectedMetric === 'prices' ? (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>Prices</span>
              </div>
            ) : null}
            {selectedMetric === 'both' || selectedMetric === 'rents' ? (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
                <span>Rents</span>
              </div>
            ) : null}
            {selectedMetric === 'ratio' ? (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                <span>Rent-to-Price Ratio</span>
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading trend data...</div>
            </div>
          </div>
        ) : (
          <div className="h-96 relative">
            {/* Simplified chart representation */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent rounded-lg">
              <div className="h-full flex items-end justify-between px-4 pb-4">
                {trendData.priceData.slice(0, 20).map((item, index) => {
                  const maxPrice = Math.max(...trendData.priceData.map(d => d.value));
                  const maxRent = Math.max(...trendData.rentData.map(d => d.value));
                  const priceHeight = (item.value / maxPrice) * 300;
                  const rentHeight = (trendData.rentData[index]?.value / maxRent) * 300;
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      {(selectedMetric === 'both' || selectedMetric === 'prices') && (
                        <div 
                          className="w-3 bg-blue-500 rounded-t"
                          style={{ height: `${priceHeight}px` }}
                          title={`${item.date}: ${formatCurrency(item.value)}`}
                        ></div>
                      )}
                      {(selectedMetric === 'both' || selectedMetric === 'rents') && (
                        <div 
                          className="w-3 bg-emerald-500 rounded-t"
                          style={{ height: `${rentHeight}px` }}
                          title={`${item.date}: ${formatCurrency(trendData.rentData[index]?.value)}`}
                        ></div>
                      )}
                      {selectedMetric === 'ratio' && (
                        <div 
                          className="w-3 bg-purple-500 rounded-t"
                          style={{ height: `${(trendData.ratioData[index]?.value / 12) * 300}px` }}
                          title={`${item.date}: ${trendData.ratioData[index]?.value.toFixed(1)}%`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Data Points</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trendData.priceData.slice(-10).reverse().map((item, index) => {
                const rentItem = trendData.rentData[trendData.rentData.length - 10 + (9 - index)];
                const ratioItem = trendData.ratioData[trendData.ratioData.length - 10 + (9 - index)];
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(rentItem?.value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(ratioItem?.value || 0).toFixed(1)}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getChangeColor(item.change)}`}>
                      {formatPercent(item.change)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getChangeColor(rentItem?.change || 0)}`}>
                      {formatPercent(rentItem?.change || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends;
