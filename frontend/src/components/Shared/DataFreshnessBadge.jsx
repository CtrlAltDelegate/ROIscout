import React, { useState } from 'react';

/** Default tooltip text per Launch Readiness plan: trust signal, sources, monthly cadence. */
const DEFAULT_SOURCES_TOOLTIP =
  'Data from Zillow Research, HUD Fair Market Rents, and Census Bureau. Updated monthly. Always verify independently before making investment decisions.';

/**
 * Data freshness indicator per Launch Readiness plan.
 * Visible "Data last updated: [month/year]" badge with tooltip explaining sources.
 * Transparency here prevents churn — investors understand market data is published monthly.
 */
const DataFreshnessBadge = ({ dataLastUpdated, dataSources, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const displayDate = dataLastUpdated
    ? (() => {
        const d = new Date(dataLastUpdated);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      })()
    : null;

  const tooltipText = dataSources || DEFAULT_SOURCES_TOOLTIP;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600 text-sm border border-gray-200 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={tooltipText}
        aria-describedby="data-freshness-tooltip"
      >
        <span className="text-gray-500 shrink-0" aria-hidden>📅</span>
        <span>
          {displayDate ? (
            <>Data last updated: {displayDate}</>
          ) : (
            <>Data last updated: —</>
          )}
        </span>
      </span>
      {showTooltip && (
        <div
          id="data-freshness-tooltip"
          className="absolute z-10 left-0 bottom-full mb-2 w-72 p-3 text-sm text-left bg-gray-800 text-gray-100 rounded-lg shadow-lg pointer-events-none"
          role="tooltip"
        >
          <p className="font-medium text-white mb-1">Data sources</p>
          <p className="text-gray-300">{tooltipText}</p>
        </div>
      )}
    </div>
  );
};

export default DataFreshnessBadge;
