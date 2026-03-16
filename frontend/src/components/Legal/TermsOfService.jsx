import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ROIscout (“Service”), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">2. Description of Service</h2>
            <p>
              ROIscout provides market data and analytics tools to help real estate investors evaluate
              rental markets. The Service includes zip-level metrics, interactive maps, filters, and
              saved searches, subject to your subscription tier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">3. Data Disclaimer</h2>
            <p className="bg-amber-50 border-l-4 border-amber-400 p-4 text-gray-800">
              <strong>Important:</strong> Market data is sourced from Zillow Research, HUD Fair Market
              Rents, and Census Bureau public datasets. Data is updated monthly. This information is
              for research and educational purposes only. Always verify independently before making
              investment decisions. ROIscout is not responsible for decisions made based on the data
              or tools provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">4. Subscription and Payment</h2>
            <p>
              Subscription tiers (e.g., Basic, Pro) are billed monthly. You may cancel at any time;
              access continues until the end of the current billing period. Refunds are at our
              discretion unless required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">5. Acceptable Use</h2>
            <p>
              You agree not to misuse the Service (e.g., scraping, reselling data, or circumventing
              access controls). We may suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided “as is.” We do not warrant accuracy, completeness, or
              fitness for a particular purpose. Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ROIscout and its operators shall not be liable
              for any indirect, incidental, special, or consequential damages arising from your use
              of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">8. Contact</h2>
            <p>
              Questions about these terms? Contact us through the information provided on the
              ROIscout website or in your account settings.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
