/**
 * MarketFinder.jsx — Investor wizard that surfaces top matching markets.
 *
 * 4 steps → results page
 *   1. Your Budget     — down payment, rate, term
 *   2. Target Property — beds, baths, property management
 *   3. Where to Invest — any / specific states / in-state
 *   4. Your Goals      — min CoC, priority, market type
 *   Results            — top 25 markets ranked by match score
 */

import React, { useState, useCallback } from 'react';
import { apiService } from '../../services/api';
import ROITable from './ROITable';

// ── US States for multi-select ─────────────────────────────────────────────────
const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
];

const TOTAL_STEPS = 4;

// ── Reusable input components ─────────────────────────────────────────────────

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500';

const FieldLabel = ({ children, sub }) => (
  <label className="block text-sm font-medium text-gray-300 mb-1.5">
    {children}
    {sub && <span className="text-gray-500 font-normal ml-1 text-xs">{sub}</span>}
  </label>
);

const DollarInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} pl-7`} placeholder={placeholder} min="0" />
  </div>
);

const PctInput = ({ value, onChange, step = '0.25', min = '0' }) => (
  <div className="relative">
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} pr-7`} step={step} min={min} />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
  </div>
);

const ChoiceButton = ({ label, sub, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
      active
        ? 'bg-emerald-500/10 border-emerald-500 text-white'
        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
    }`}>
    <span className="font-medium">{label}</span>
    {sub && <span className="block text-xs text-gray-500 mt-0.5">{sub}</span>}
  </button>
);

const BedButton = ({ n, label, active, onClick }) => (
  <button onClick={onClick}
    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
      active
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
    }`}>
    {label || n}
  </button>
);

// ── Step components ───────────────────────────────────────────────────────────

function StepBudget({ data, set }) {
  const maxPrice = data.downPct > 0 ? Math.round(data.downBudget / (data.downPct / 100)) : 0;
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Down Payment Budget</FieldLabel>
        <DollarInput value={data.downBudget} onChange={v => set('downBudget', Number(v))} placeholder="50000" />
      </div>
      <div>
        <FieldLabel>Down Payment %</FieldLabel>
        <div className="flex gap-2">
          {[3.5, 10, 20, 25].map(p => (
            <button key={p} onClick={() => set('downPct', p)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                data.downPct === p ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}>
              {p}%
            </button>
          ))}
        </div>
      </div>
      {maxPrice > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">Max purchase price</p>
          <p className="text-xl font-bold text-white">${maxPrice.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Loan: ${Math.round(maxPrice * (1 - data.downPct / 100)).toLocaleString()}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Interest Rate</FieldLabel>
          <PctInput value={data.interestRate} onChange={v => set('interestRate', Number(v))} step="0.05" />
        </div>
        <div>
          <FieldLabel>Loan Term</FieldLabel>
          <select value={data.loanTerm} onChange={e => set('loanTerm', Number(e.target.value))} className={inputCls}>
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>
      </div>
    </div>
  );
}

const ReservePctInput = ({ label, sub, value, onChange }) => (
  <div className="bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 w-20">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.max(0, Math.min(30, Number(e.target.value))))}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
          min="0" max="30" step="0.5"
        />
        <span className="text-gray-400 text-sm">%</span>
      </div>
    </div>
    {/* Visual bar */}
    <div className="h-1 bg-gray-700 rounded-full">
      <div
        className="h-1 bg-emerald-500 rounded-full transition-all"
        style={{ width: `${Math.min((value / 15) * 100, 100)}%` }}
      />
    </div>
  </div>
);

function StepProperty({ data, set }) {

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Bedrooms</FieldLabel>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <BedButton key={n} n={n} label={n === 5 ? '5+' : n} active={data.beds === n} onClick={() => set('beds', n)} />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Bathrooms</FieldLabel>
        <div className="flex gap-2">
          {[1, 1.5, 2, 2.5, 3].map(n => (
            <BedButton key={n} n={n} label={n} active={data.baths === n} onClick={() => set('baths', n)} />
          ))}
        </div>
      </div>

      {/* Property Management */}
      <div>
        <FieldLabel>Property Management</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            label="Self-managed"
            sub="No management fee"
            active={!data.useManager}
            onClick={() => set('useManager', false)}
          />
          <ChoiceButton
            label="Property manager"
            sub="Enter their fee below"
            active={data.useManager}
            onClick={() => set('useManager', true)}
          />
        </div>
        {data.useManager && (
          <div className="mt-2">
            <ReservePctInput
              label="Management Fee"
              sub="% of monthly rent charged by your property manager"
              value={data.managementPct}
              onChange={v => set('managementPct', v)}
            />
          </div>
        )}
      </div>

      {/* Operating Reserves */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>Operating Reserves <span className="text-gray-500 font-normal text-xs">(% of monthly rent set aside)</span></FieldLabel>
        </div>
        <div className="space-y-2">
          <ReservePctInput
            label="Repairs & Maintenance"
            sub="Ongoing upkeep: appliances, plumbing, paint, etc."
            value={data.maintenancePct}
            onChange={v => set('maintenancePct', v)}
          />
          <ReservePctInput
            label="Capital Expenditures"
            sub="Big-ticket items: roof, HVAC, water heater, flooring"
            value={data.capexPct}
            onChange={v => set('capexPct', v)}
          />
          <ReservePctInput
            label="Vacancy"
            sub="Income lost while the unit is between tenants"
            value={data.vacancyPct}
            onChange={v => set('vacancyPct', v)}
          />
        </div>

      </div>
    </div>
  );
}

function StepLocation({ data, set }) {
  const toggleState = (code) => {
    const current = data.selectedStates || [];
    if (current.includes(code)) {
      set('selectedStates', current.filter(s => s !== code));
    } else {
      set('selectedStates', [...current, code]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <ChoiceButton
          label="Anywhere in the US"
          sub="Search all 49 states for the best match"
          active={data.geography === 'any'}
          onClick={() => set('geography', 'any')}
        />
        <ChoiceButton
          label="Specific states"
          sub="I have states in mind"
          active={data.geography === 'states'}
          onClick={() => set('geography', 'states')}
        />
        <ChoiceButton
          label="In my state"
          sub="Keep it local"
          active={data.geography === 'instate'}
          onClick={() => set('geography', 'instate')}
        />
      </div>

      {data.geography === 'states' && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Select states ({(data.selectedStates || []).length} selected)</p>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {US_STATES.map(([code, name]) => {
              const active = (data.selectedStates || []).includes(code);
              return (
                <button key={code} onClick={() => toggleState(code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}>
                  {code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {data.geography === 'instate' && (
        <div>
          <FieldLabel>Which state are you in?</FieldLabel>
          <select value={data.userState || ''} onChange={e => set('userState', e.target.value)} className={inputCls}>
            <option value="">Select your state</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function StepGoals({ data, set }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Minimum Cash-on-Cash Return" sub="(annual cash flow ÷ down payment)" />
        <div className="flex gap-2">
          {[5, 8, 10, 12, 15].map(n => (
            <button key={n} onClick={() => set('minCoc', n)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                data.minCoc === n ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}>
              {n}%+
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Primary Goal</FieldLabel>
        <div className="space-y-2">
          <ChoiceButton label="Maximize cash flow" sub="Rank markets by highest monthly income" active={data.priority === 'cashflow'} onClick={() => set('priority', 'cashflow')} />
          <ChoiceButton label="Long-term appreciation" sub="Favor markets with strong rent & price growth trends" active={data.priority === 'growth'} onClick={() => set('priority', 'growth')} />
          <ChoiceButton label="Low entry price" sub="Get in at the lowest price with positive cash flow" active={data.priority === 'entry'} onClick={() => set('priority', 'entry')} />
        </div>
      </div>

      <div>
        <FieldLabel>Market Type</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton label="Any market" sub="Show me everything" active={data.marketType === 'any'} onClick={() => set('marketType', 'any')} />
          <ChoiceButton label="🔥 Hot markets" sub="High demand, low days on market" active={data.marketType === 'hot'} onClick={() => set('marketType', 'hot')} />
          <ChoiceButton label="⚖️ Stable markets" sub="Established, not overheated" active={data.marketType === 'stable'} onClick={() => set('marketType', 'stable')} />
          <ChoiceButton label="💰 Affordable entry" sub="Sub-$150k purchase prices" active={data.marketType === 'affordable'} onClick={() => set('marketType', 'affordable')} />
        </div>
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function ResultsSummary({ response, answers }) {
  const { data, total, maxPrice } = response;
  const stateCount = new Set(data.map(r => r.state)).size;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            {total === 0 ? 'No markets found' : `${total > 25 ? '25+' : total} Markets Found`}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.length > 0
              ? `Top ${data.length} matches across ${stateCount} state${stateCount !== 1 ? 's' : ''} · sorted by match score`
              : 'Try adjusting your minimum CoC or expanding your geography'}
          </p>
        </div>
      </div>

      {/* Criteria summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          `$${(answers.downBudget/1000).toFixed(0)}k down @ ${answers.downPct}%`,
          `Max $${(maxPrice/1000).toFixed(0)}k`,
          `${answers.beds}BR / ${answers.baths}BA`,
          `${answers.interestRate}% rate`,
          `${answers.minCoc}%+ CoC target`,
          answers.managementPct > 0 ? 'Property managed' : 'Self-managed',
          answers.priority === 'cashflow' ? 'Max cash flow' : answers.priority === 'growth' ? 'Appreciation focus' : 'Low entry',
        ].map(label => (
          <span key={label} className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const DEFAULT_ANSWERS = {
  // Step 1
  downBudget:     50000,
  downPct:        20,
  interestRate:   7.25,
  loanTerm:       30,
  // Step 2
  beds:           3,
  baths:          2,
  useManager:     false,
  managementPct:  8,
  maintenancePct: 5,
  capexPct:       5,
  vacancyPct:     5,
  // Step 3
  geography:      'any',
  selectedStates: [],
  userState:      '',
  // Step 4
  minCoc:         8,
  priority:       'cashflow',
  marketType:     'any',
};

const STEP_TITLES = [
  { n: 1, title: 'Your Budget',       sub: 'How much are you working with?' },
  { n: 2, title: 'Target Property',   sub: 'What are you looking to buy?' },
  { n: 3, title: 'Where to Invest',   sub: 'Geography preference?' },
  { n: 4, title: 'Your Goals',        sub: 'What does success look like?' },
];

const MarketFinder = ({ user }) => {
  const [step, setStep]       = useState(1);
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [results, setResults] = useState(null);

  const set = useCallback((field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  }, []);

  const getStates = () => {
    if (answers.geography === 'instate') return answers.userState || '';
    if (answers.geography === 'states')  return (answers.selectedStates || []).join(',');
    return '';
  };

  const canProceed = () => {
    if (step === 1) return answers.downBudget > 0 && answers.downPct > 0 && answers.interestRate > 0;
    if (step === 3 && answers.geography === 'instate') return !!answers.userState;
    if (step === 3 && answers.geography === 'states')  return (answers.selectedStates || []).length > 0;
    return true;
  };

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.findMarkets({
        downBudget:    answers.downBudget,
        downPct:       answers.downPct,
        interestRate:  answers.interestRate,
        loanTerm:      answers.loanTerm,
        beds:          answers.beds,
        baths:         answers.baths,
        managementPct: answers.useManager ? answers.managementPct : 0,
        maintenancePct: answers.maintenancePct,
        capexPct:      answers.capexPct,
        vacancyPct:    answers.vacancyPct,
        states:        getStates(),
        minCoc:        answers.minCoc,
        priority:      answers.priority,
        marketType:    answers.marketType,
        limit:         25,
      });
      setResults(res);
      setStep('results');
    } catch (e) {
      setError(e.response?.data?.message || 'Search failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  // Convert results data for ROITable (attach _computed as cashFlowParams-style)
  const tableData = results?.data?.map(r => ({
    ...r,
    // Expose computed values so ROITable expansion shows them
    _finderResult: r._computed,
  })) || [];

  // cashFlowParams object to pass to ROITable so CF breakdown shows in expanded rows
  const cfParams = results ? {
    downBudget:      answers.downBudget,
    downPct:         answers.downPct,
    interestRate:    answers.interestRate,
    loanTermYears:   answers.loanTerm,
    insuranceRate:   0.5,
    taxRateOverride: null,
    maintenancePct:  answers.maintenancePct,
    vacancyPct:      answers.vacancyPct,
    capexPct:        answers.capexPct,
    managementPct:   answers.useManager ? answers.managementPct : 0,
    beds:            answers.beds,
    baths:           answers.baths,
  } : null;

  // ── Results view ─────────────────────────────────────────────────────────────
  if (step === 'results' && results) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep(4); setResults(null); }}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            ← Back to wizard
          </button>
          <button onClick={runSearch} disabled={loading}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            {loading ? 'Searching…' : '↺ Re-run search'}
          </button>
        </div>
        <ResultsSummary response={results} answers={answers} />
        {tableData.length > 0 ? (
          <ROITable
            data={tableData}
            dataLastUpdated={null}
            dataSources={null}
            cashFlowParams={cfParams}
            finderMode={true}
          />
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-10 text-center">
            <p className="text-gray-400 text-sm">No markets matched your criteria.</p>
            <p className="text-gray-500 text-xs mt-2">Try lowering your minimum CoC, expanding geography, or increasing your budget.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Wizard view ───────────────────────────────────────────────────────────────
  const { title, sub } = STEP_TITLES[step - 1];

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i + 1 <= step ? 'bg-emerald-500' : 'bg-gray-700'
          }`} />
        ))}
      </div>

      {/* Step card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <div className="mb-6">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
            Step {step} of {TOTAL_STEPS}
          </p>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
        </div>

        {step === 1 && <StepBudget data={answers} set={set} />}
        {step === 2 && <StepProperty data={answers} set={set} />}
        {step === 3 && <StepLocation data={answers} set={set} />}
        {step === 4 && <StepGoals data={answers} set={set} />}

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-medium hover:border-gray-400 transition-colors">
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold transition-colors">
              Continue
            </button>
          ) : (
            <button onClick={runSearch} disabled={loading || !canProceed()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding markets…
                </span>
              ) : 'Find My Markets →'}
            </button>
          )}
        </div>
      </div>

      {/* Reset */}
      {step > 1 && (
        <button onClick={() => { setAnswers(DEFAULT_ANSWERS); setStep(1); }}
          className="w-full mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
          Start over
        </button>
      )}
    </div>
  );
};

export default MarketFinder;
