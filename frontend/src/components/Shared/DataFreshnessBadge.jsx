import React, { useState } from 'react';

/**
 * Data freshness indicator per Launch Readiness plan.
 * Shows "Data last updated: [month/year]" with tooltip explaining sources.
 */
const DataFreshnessBadge = ({ dataLastUpdated, dataSources, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const displayDate = dataLastUpdated
    ? (() => {
        const d = new Date(dataLastUpdated);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      })()
    : null;

  const defaultSources =
    dataSources ||
    'Market data sourced from Zillow Research, HUD, and Census Bureau public datasets. Updated monthly.';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-sm border border-gray-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={defaultSources}
      >
        <span className="text-gray-500" aria-hidden>📅</span>
        {displayDate ? (
          <>Data last updated: {displayDate}</>
        ) : (
          <>Data last updated: —</>
        )}
      </span>
      {showTooltip && (
        <div
          className="absolute z-10 left-0 bottom-full mb-2 w-72 p-3 text-sm text-left bg-gray-800 text-gray-100 rounded-lg shadow-lg"
          role="tooltip"
        >
          <p className="font-medium text-white mb-1">Data sources</p>
          <p className="text-gray-300">{defaultSources}</p>
          <p className="text-gray-400 mt-2 text-xs">
            Always verify independently before making investment decisions.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataFreshnessBadge;
