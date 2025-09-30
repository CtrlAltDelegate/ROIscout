import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Info, 
  Download,
  Share2,
  BarChart3,
  PieChart
} from 'lucide-react';

const CashOnCashCalculator = () => {
  const [inputs, setInputs] = useState({
    purchasePrice: 250000,
    downPayment: 50000,
    closingCosts: 7500,
    rehabCosts: 15000,
    monthlyRent: 2200,
    monthlyExpenses: 800,
    loanAmount: 200000,
    interestRate: 6.5,
    loanTerm: 30
  });

  const [results, setResults] = useState({});
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    calculateResults();
  }, [inputs]);

  const calculateResults = () => {
    const {
      purchasePrice,
      downPayment,
      closingCosts,
      rehabCosts,
      monthlyRent,
      monthlyExpenses,
      loanAmount,
      interestRate,
      loanTerm
    } = inputs;

    // Total cash invested
    const totalCashInvested = downPayment + closingCosts + rehabCosts;

    // Monthly mortgage payment (P&I only)
    const monthlyRate = (interestRate / 100) / 12;
    const numPayments = loanTerm * 12;
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Monthly cash flow
    const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    // Cash-on-cash return
    const cashOnCashReturn = (annualCashFlow / totalCashInvested) * 100;

    // Additional metrics
    const capRate = ((monthlyRent * 12 - (monthlyExpenses * 12)) / purchasePrice) * 100;
    const rentToPrice = (monthlyRent * 12 / purchasePrice) * 100;
    const debtServiceCoverage = (monthlyRent - monthlyExpenses) / monthlyMortgage;

    setResults({
      totalCashInvested,
      monthlyMortgage,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashReturn,
      capRate,
      rentToPrice,
      debtServiceCoverage
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const getReturnColor = (returnRate) => {
    if (returnRate >= 12) return 'text-emerald-600';
    if (returnRate >= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReturnLabel = (returnRate) => {
    if (returnRate >= 12) return 'Excellent';
    if (returnRate >= 8) return 'Good';
    if (returnRate >= 4) return 'Fair';
    return 'Poor';
  };

  const exportResults = () => {
    const data = {
      inputs,
      results,
      calculatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cash-on-cash-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cash-on-Cash Return Calculator</h1>
            <p className="text-gray-600 mt-1">Calculate your real return on invested capital with financing</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Purchase Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-600" />
                  Purchase Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    value={inputs.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Down Payment
                  </label>
                  <input
                    type="number"
                    value={inputs.downPayment}
                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Costs
                  </label>
                  <input
                    type="number"
                    value={inputs.closingCosts}
                    onChange={(e) => handleInputChange('closingCosts', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rehab/Repair Costs
                  </label>
                  <input
                    type="number"
                    value={inputs.rehabCosts}
                    onChange={(e) => handleInputChange('rehabCosts', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Income & Expenses */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
                  Income & Expenses
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Expenses
                    <button className="ml-1 text-gray-400 hover:text-gray-600">
                      <Info className="w-3 h-3" />
                    </button>
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyExpenses}
                    onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taxes, insurance, maintenance, vacancy, management
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    value={inputs.loanAmount}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Term (years)
                  </label>
                  <select
                    value={inputs.loanTerm}
                    onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
              <div className="flex space-x-2">
                <button
                  onClick={exportResults}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export Results"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share Results"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Metric */}
            <div className="text-center mb-6 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">Cash-on-Cash Return</div>
              <div className={`text-3xl font-bold ${getReturnColor(results.cashOnCashReturn || 0)}`}>
                {(results.cashOnCashReturn || 0).toFixed(1)}%
              </div>
              <div className="text-sm font-medium text-gray-700">
                {getReturnLabel(results.cashOnCashReturn || 0)}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Cash Invested</span>
                <span className="font-semibold text-gray-900">
                  ${(results.totalCashInvested || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Monthly Cash Flow</span>
                <span className={`font-semibold ${(results.monthlyCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${(results.monthlyCashFlow || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Annual Cash Flow</span>
                <span className={`font-semibold ${(results.annualCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${(results.annualCashFlow || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Cap Rate</span>
                <span className="font-semibold text-gray-900">
                  {(results.capRate || 0).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Rent-to-Price Ratio</span>
                <span className="font-semibold text-gray-900">
                  {(results.rentToPrice || 0).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">DSCR</span>
                <span className={`font-semibold ${(results.debtServiceCoverage || 0) >= 1.2 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(results.debtServiceCoverage || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Breakdown Toggle */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full mt-6 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showBreakdown ? 'Hide' : 'Show'} Breakdown
            </button>
          </div>

          {/* Detailed Breakdown */}
          {showBreakdown && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">+ Monthly Rent</span>
                  <span className="font-medium">${inputs.monthlyRent.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">- Operating Expenses</span>
                  <span className="font-medium">-${inputs.monthlyExpenses.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">- Mortgage Payment</span>
                  <span className="font-medium">-${(results.monthlyMortgage || 0).toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Cash Flow</span>
                    <span className={`${(results.monthlyCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${(results.monthlyCashFlow || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Understanding Cash-on-Cash Return
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">What is Cash-on-Cash Return?</h4>
            <p>
              Cash-on-cash return measures the annual pre-tax cash flow relative to the amount of cash invested. 
              It's particularly useful for leveraged investments where you use financing.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Good Return Benchmarks</h4>
            <ul className="space-y-1">
              <li>• <span className="text-emerald-600 font-medium">12%+</span> - Excellent return</li>
              <li>• <span className="text-yellow-600 font-medium">8-12%</span> - Good return</li>
              <li>• <span className="text-orange-600 font-medium">4-8%</span> - Fair return</li>
              <li>• <span className="text-red-600 font-medium">&lt;4%</span> - Poor return</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashOnCashCalculator;
