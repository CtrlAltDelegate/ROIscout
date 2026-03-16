import React from 'react';

/**
 * Standard data disclaimer per Launch Readiness plan.
 * Use in footer, landing, or near any data-dependent UI.
 */
const DataDisclaimer = ({ className = '' }) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    Market data sourced from Zillow Research, HUD, and Census Bureau public datasets. Updated
    monthly. Always verify independently before making investment decisions.
  </p>
);

export default DataDisclaimer;
