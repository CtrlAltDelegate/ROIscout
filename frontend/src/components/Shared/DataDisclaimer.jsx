import React from 'react';

/**
 * Canonical data disclaimer: sources, update frequency, and verification expectation.
 * Use in footer, landing, dashboard, and near any data-dependent UI. Keeps expectations
 * accurate and supports legal protection without sounding defensive.
 */
const DATA_DISCLAIMER_TEXT =
  'Market data sourced from Zillow Research, HUD, and Census Bureau public datasets. Updated monthly. Always verify independently before making investment decisions.';

const DataDisclaimer = ({ className = '' }) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {DATA_DISCLAIMER_TEXT}
  </p>
);

export default DataDisclaimer;
export { DATA_DISCLAIMER_TEXT };
