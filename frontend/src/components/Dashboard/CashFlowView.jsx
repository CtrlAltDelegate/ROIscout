/**
 * CashFlowView.jsx — Standalone Cash Flow Analysis tab.
 *
 * No toggle, no separate filter panel. The investor enters their
 * parameters (down payment, rates, expenses) + picks a state and
 * bed/bath type directly inside this view.
 *
 * Rent is sourced from our Zillow ZORI data — investors do NOT enter it.
 * We know median asking rent per zip code and use it automatically.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { monthlyPI, STATE_TAX_RATES } from '../../utils/cashFlow';
import ROITable from './ROITable';

// States are loaded from the API — only states with actual Zillow data are shown

const PROPERTY_TYPES = [
  { value: '3bed2bath', label: '3 Bed / 2 Bath' },
  { value: '2bed2bath', label: '2 Bed / 2 Bath' },
  { value: '4bed3bath', label: '4 Bed / 3 Bath' },
  { value: '1bed1bath', label: '1 Bed / 1 Bath' },
];

const DEFAULT_PARAMS = {
  state:           '',
  propertyType:    '3bed2bath',
  downBudget:      50000,
  downPct:         20,
  interestRate:    7.25,
  loanTermYears:   30,
  insuranceRate:   0.50,
  taxRateOverride: null,
  maintenancePct:  5,
  vacancyPct:      5,
  capexPct:        5,
  managementPct:   0,
};

// ── Input components ──────────────────────────────────────────────────────────

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500";
const selectCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500";

const PctInput = ({ value, onChange, placeholder, step = '1', min = '0', max = '100' }) => (
  <div className="relative">
    <input
      type="number" value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} pr-8`} placeholder={placeholder}
      step={step} min={min} max={max}
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
  </div>
);

const DollarInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
    <input
      type="number" value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} pl-7`} placeholder={placeholder} min="0"
    />
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">{children}</p>
);

const FieldLabel = ({ children }) => (
  <label className="block text-xs text-gray-400 mb-1.5">{children}</label>
);

// ── Main component ─────────────────────────────────────────────────────────────

const CashFlowView = ({ user }) => {
  const isPro = (user?.subscription_plan || user?.plan) === 'pro' || !!user?.is_admin;

  const [states, setStates]                   = useState([]);
  const [params, setParams]                   = useState(DEFAULT_PARAMS);
  const [data, setData]                       = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);
  const [dataSources, setDataSources]         = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [exporting, setExporting]             = useState(false);

  // Load only states that have actual data
  useEffect(() => {
    apiService.getStates().then(r => setStates(r.data || [])).catch(() => setStates([]));
  }, []);

  // Fetch zip data when state or propertyType changes
  const fetchData = useCallback(async (state, propertyType) => {
    if (!state) { setData([]); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiService.getPricingData({ state, propertyType, limit: 500 });
      setData(res.data || []);
      setDataLastUpdated(res.dataLastUpdated ?? null);
      setDataSources(res.dataSources ?? null);
    } catch {
      setData([]); setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(params.state, params.propertyType);
  }, [params.state, params.propertyType, fetchData]);

  const set = (field, raw) => {
    setParams(prev => ({ ...prev, [field]: raw === '' ? '' : (field === 'taxRateOverride' ? (raw === '' ? null : Number(raw)) : (isNaN(Number(raw)) ? raw : Number(raw))) }));
  };

  const setRaw = (field, val) => setParams(prev => ({ ...prev, [field]: val }));

  const reset = () => setParams(DEFAULT_PARAMS);

  // Derived preview values
  const downBudget   = Number(params.downBudget) || 0;
  const downPct      = Number(params.downPct) || 20;
  const maxPrice     = downPct > 0 ? downBudget / (downPct / 100) : 0;
  const loanAmount   = maxPrice * (1 - downPct / 100);
  const piPreview    = monthlyPI(loanAmount, Number(params.interestRate) || 7.25, Number(params.loanTermYears) || 30);
  const taxRate      = params.taxRateOverride != null ? params.taxRateOverride : (STATE_TAX_RATES[params.state] ?? 1.0);
  const taxPreview   = maxPrice * (taxRate / 100) / 12;
  const insPreview   = maxPrice * ((Number(params.insuranceRate) || 0.5) / 100) / 12;
  const pitiPreview  = piPreview + taxPreview + insPreview;
  const fmt          = n => Math.round(n).toLocaleString();

  // Affordable markets check
  const affordableCount = maxPrice > 0 ? data.filter(r => r.median_price <= maxPrice).length : 0;

  const handleExportCSV = async () => {
    setExporting(true);
    try { await apiService.exportCSV({ state: params.state, propertyType: params.propertyType }); }
    catch { /* swallow */ }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      {/* ── Calculator panel ── */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">💰 Cash Flow Calculator</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              We use Zillow ZORI median rents per zip — you never need to enter rent.
              Set your investment parameters and pick a state to rank markets by cash-on-cash return.
            </p>
          </div>
          <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 ml-4">
            Reset defaults
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* ── Property ── */}
          <div>
            <SectionLabel>Property</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>State</FieldLabel>
                <select value={params.state} onChange={e => setRaw('state', e.target.value)} className={selectCls}>
                  <option value="">Select a state…</option>
                  {states.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Property Type</FieldLabel>
                <select value={params.propertyType} onChange={e => setRaw('propertyType', e.target.value)} className={selectCls}>
                  {PROPERTY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Rent sourced from Zillow ZORI — zip-level market median
                </p>
              </div>
            </div>
          </div>

          {/* ── Down Payment ── */}
          <div>
            <SectionLabel>Down Payment</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Budget ($)</FieldLabel>
                <DollarInput value={params.downBudget} onChange={v => set('downBudget', v)} placeholder="50000" />
              </div>
              <div>
                <FieldLabel>Down %</FieldLabel>
                <PctInput value={params.downPct} onChange={v => set('downPct', v)} placeholder="20" step="1" max="100" />
              </div>
            </div>
            {maxPrice > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span className="text-gray-400">Max affordable price:
                  <span className="text-white font-semibold ml-1">${fmt(maxPrice)}</span>
                </span>
                <span className="text-gray-500">Loan: ${fmt(loanAmount)}</span>
                {params.state && (
                  <span className="text-emerald-400 font-medium">{affordableCount} markets within budget</span>
                )}
              </div>
            )}
          </div>

          {/* ── Financing + PITI ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <SectionLabel>Financing</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Interest Rate (%)</FieldLabel>
                  <PctInput value={params.interestRate} onChange={v => set('interestRate', v)} placeholder="7.25" step="0.05" max="30" />
                </div>
                <div>
                  <FieldLabel>Loan Term</FieldLabel>
                  <select value={params.loanTermYears} onChange={e => set('loanTermYears', e.target.value)} className={selectCls}>
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>PITI — Taxes &amp; Insurance</SectionLabel>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Annual Insurance (% of value)</FieldLabel>
                  <PctInput value={params.insuranceRate} onChange={v => set('insuranceRate', v)} placeholder="0.50" step="0.05" max="10" />
                </div>
                <div>
                  <FieldLabel>
                    Property Tax Override
                    {params.state && (
                      <span className="ml-1 text-gray-500 font-normal normal-case">
                        (state avg {(STATE_TAX_RATES[params.state] ?? 1.0).toFixed(2)}% — leave blank to use it)
                      </span>
                    )}
                  </FieldLabel>
                  <PctInput
                    value={params.taxRateOverride ?? ''}
                    onChange={v => setParams(prev => ({ ...prev, taxRateOverride: v === '' ? null : Number(v) }))}
                    placeholder={params.state ? String((STATE_TAX_RATES[params.state] ?? 1.0).toFixed(2)) : '1.00'}
                    step="0.01" max="10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Operating Reserves ── */}
          <div>
            <SectionLabel>Operating Reserves <span className="text-gray-500 font-normal normal-case">(% of monthly rent)</span></SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Maintenance', field: 'maintenancePct' },
                { label: 'Vacancy',     field: 'vacancyPct'     },
                { label: 'CapEx',       field: 'capexPct'       },
                { label: 'Management', field: 'managementPct'  },
              ].map(({ label, field }) => (
                <div key={field}>
                  <FieldLabel>{label}</FieldLabel>
                  <PctInput value={params[field]} onChange={v => set(field, v)} placeholder="5" />
                </div>
              ))}
            </div>
          </div>

          {/* ── PITI Preview ── */}
          {maxPrice > 0 && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3">
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

        </div>
      </div>

      {/* ── Results ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {params.state
                ? `Markets ranked by cash-on-cash return · ${states.find(s => s.code === params.state)?.name || params.state}`
                : 'Select a state above to load markets'}
            </h3>
            {data.length > 0 && maxPrice > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {affordableCount} of {data.length} markets within your ${fmt(maxPrice)} budget ·
                Rent from Zillow ZORI
              </p>
            )}
          </div>

          {isPro && data.length > 0 && params.state && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {exporting ? 'Exporting…' : '⬇ Export CSV'}
            </button>
          )}
          {!isPro && data.length > 0 && (
            <Link to="/pricing" className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg">
              🔒 Export <span className="text-blue-600 font-semibold">Pro</span>
            </Link>
          )}
        </div>

        <div className="p-5">
          {!params.state && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-10 text-center">
              <p className="text-2xl mb-3">💰</p>
              <p className="text-slate-600 text-sm font-medium">Enter your investment parameters above</p>
              <p className="text-slate-400 text-xs mt-1">Then select a state — we'll rank every zip by your cash-on-cash return</p>
            </div>
          )}

          {params.state && loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
            </div>
          )}

          {params.state && error && !loading && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">{error}</div>
          )}

          {params.state && !loading && !error && data.length > 0 && maxPrice > 0 && affordableCount === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-amber-800 text-sm">
              <strong>No affordable markets found.</strong> Your ${fmt(downBudget)} down at {downPct}% gives a
              max price of ${fmt(maxPrice)}, but all zip codes in this state have higher median prices.
              Try increasing your budget or down %.
            </div>
          )}

          {params.state && !loading && !error && data.length > 0 && (
            <ROITable
              data={data}
              dataLastUpdated={dataLastUpdated}
              dataSources={dataSources}
              cashFlowParams={params}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowView;
