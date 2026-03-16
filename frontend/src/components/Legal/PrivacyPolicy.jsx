import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">1. Information We Collect</h2>
            <p>
              We collect information you provide (e.g., email, name when you sign up), usage data
              (e.g., how you use the app, saved searches), and payment information processed by
              Stripe. We do not store full payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">2. How We Use It</h2>
            <p>
              We use your information to provide and improve the Service, process payments, send
              transactional and product-related emails (e.g., subscription confirmations, alerts
              you opt into), and to comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">3. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with service providers
              (e.g., Stripe for payments, hosting providers) only as needed to operate the Service.
              We may disclose information if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">4. Security</h2>
            <p>
              We use industry-standard measures to protect your data (e.g., encryption, secure
              auth). You are responsible for keeping your login credentials safe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">5. Your Rights</h2>
            <p>
              You may access, correct, or delete your account data through your account settings or
              by contacting us. You may opt out of marketing emails at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">6. Cookies and Similar Tech</h2>
            <p>
              We use cookies and similar technologies for authentication, preferences, and analytics
              to improve the Service. You can adjust browser settings to limit cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">7. Changes</h2>
            <p>
              We may update this policy from time to time. We will post the updated policy on this
              page and update the “Last updated” date. Continued use of the Service after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-6">8. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us through the ROIscout website or
              your account settings.
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

export default PrivacyPolicy;
