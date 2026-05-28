import React, { useState, useEffect } from 'react';
import { monthlyPI, STATE_TAX_RATES } from '../../utils/cashFlow';

const DEFAULT_PARAMS = {
  downBudget:     50000,   // dollar amount the investor has for a down payment
  downPct:        20,      // % down (determines max affordable price)
  interestRate:   7.25,
  loanTermYears:  30,
  insuranceRate:  0.50,
  taxRateOverride: null,   // null = use state lookup per zip
  maintenancePct: 5,
  vacancyPct:     5,
  capexPct:       5,
  managementPct:  0,
};

/**
 * CashFlowPanel — collapsible investor parameter editor.
 *
 * Props:
 *   params        — current params object (null = panel was never opened)
 *   onChange(p)   — called with updated params whenever any field changes
 *   activeState   — currently filtered state code (for default tax rate display)
 */
const CashFlowPanel = ({ params, onChange, activeState }) => {
  const [local, setLocal] = useState(params ?? DEFAULT_PARAMS);

  // If parent resets params, sync local state
  useEffect(() => {
    if (params) setLocal(params);
  }, [params]);

  const set = (field, raw) => {
    const val = raw === '' ? '' : Number(raw);
    const next = { ...local, [field]: val === '' ? '' : val };
    setLocal(next);
    onChange(next);
  };

  const setTaxOverride = (raw) => {
    const next = {
      ...local,
      taxRateOverride: raw === '' ? null : Number(raw),
    };
    setLocal(next);
    onChange(next);
  };

  const reset = () => {
    setLocal(DEFAULT_PARAMS);
    onChange(DEFAULT_PARAMS);
  };

  // Derived preview values
  const downBudget    = Number(local.downBudget) || 0;
  const downPct       = Number(local.downPct) || 20;
  const maxPrice      = downPct > 0 ? downBudget / (downPct / 100) : 0;
  const loanAmount    = maxPrice * (1 - downPct / 100);
  const piPreview     = monthlyPI(loanAmount, Number(local.interestRate) || 7.25, Number(local.loanTermYears) || 30);
  const defaultTaxRate = activeState ? (STATE_TAX_RATES[activeState] ?? 1.0) : 1.0;
  const taxRate       = local.taxRateOverride != null ? local.taxRateOverride : defaultTaxRate;
  const taxPreview    = maxPrice * (taxRate / 100) / 12;
  const insPreview    = maxPrice * ((Number(local.insuranceRate) || 0.5) / 100) / 12;
  const pitiPreview   = piPreview + taxPreview + insPreview;

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="bg-gray-800 border border-emerald-700/50 rounded-lg p-5 mt-4">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            💰 Cash Flow Calculator
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Rank markets by cash-on-cash return based on your investment parameters.
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          Reset defaults
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

        {/* ── Down Payment ── */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Down Payment
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Budget ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={local.downBudget}
                  onChange={e => set('downBudget', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="50000"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Down %</label>
              <div className="relative">
                <input
                  type="number"
                  value={local.downPct}
                  onChange={e => set('downPct', e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="20"
                  min="1" max="100" step="1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
          {/* Max price pill */}
          {maxPrice > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              Max affordable price:
              <span className="ml-1 text-white font-semibold">${fmt(maxPrice)}</span>
              <span className="text-gray-500"> · Loan: ${fmt(loanAmount)}</span>
            </p>
          )}
        </div>

        {/* ── Financing ── */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Financing
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={local.interestRate}
                  onChange={e => set('interestRate', e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  step="0.05" min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Loan Term (years)</label>
              <select
                value={local.loanTermYears}
                onChange={e => set('loanTermYears', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── PITI ── */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            PITI (taxes &amp; insurance)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Annual Insurance (% of value)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={local.insuranceRate}
                  onChange={e => set('insuranceRate', e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  step="0.05" min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Property Tax Override
                <span className="ml-1 text-gray-500 normal-case font-normal">
                  (leave blank = state avg
                  {activeState ? ` ${(STATE_TAX_RATES[activeState] ?? 1.0).toFixed(2)}%` : ''})
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={local.taxRateOverride ?? ''}
                  onChange={e => setTaxOverride(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={activeState ? String((STATE_TAX_RATES[activeState] ?? 1.0).toFixed(2)) : '1.00'}
                  step="0.01" min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Operating Reserves ── */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Operating Reserves <span className="text-gray-500 font-normal normal-case">(% of monthly rent)</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Maintenance', field: 'maintenancePct' },
              { label: 'Vacancy',     field: 'vacancyPct'     },
              { label: 'CapEx',       field: 'capexPct'       },
              { label: 'Management',  field: 'managementPct'  },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={local[field]}
                    onChange={e => set(field, e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    step="1" min="0" max="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── PITI Preview Card ── */}
      {maxPrice > 0 && (
        <div className="mt-5 bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Monthly PITI preview · at max price (${fmt(maxPrice)})
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-300">P&amp;I <span className="text-white font-medium">${fmt(piPreview)}</span></span>
            <span className="text-gray-300">Tax <span className="text-white font-medium">${fmt(taxPreview)}</span></span>
            <span className="text-gray-300">Ins <span className="text-white font-medium">${fmt(insPreview)}</span></span>
            <span className="text-emerald-400 font-semibold">PITI ${fmt(pitiPreview)}/mo</span>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Markets are re-sorted by cash-on-cash return and filtered to properties at or below your max affordable price.
        Property tax rates sourced from Tax Foundation 2024 state averages.
      </p>
    </div>
  );
};

export { DEFAULT_PARAMS };
export default CashFlowPanel;
