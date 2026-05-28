import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ n, title, children }) => (
  <section className="mb-8">
    <h2 className="text-base font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
      {n}. {title}
    </h2>
    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
  </section>
);

const TermsOfService = () => (
  <div className="min-h-screen bg-slate-50 py-12 px-4">
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10">
      <div className="mb-8">
        <Link to="/" className="text-sm font-bold mb-6 inline-block">
          <span className="text-green-600">ROI</span><span className="text-slate-900">Scout</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Terms of Service</h1>
        <p className="text-xs text-slate-400 mt-1">Last updated: May 2026</p>
      </div>

      <Section n="1" title="Acceptance of Terms">
        <p>
          By accessing or using ROIScout ("Service"), you agree to be bound by these Terms of Service
          and our Privacy Policy. If you do not agree to these terms, do not use the Service. We may
          update these terms from time to time; continued use after changes constitutes acceptance.
        </p>
      </Section>

      <Section n="2" title="Description of Service">
        <p>
          ROIScout provides real estate market analytics tools to help investors evaluate rental markets.
          The Service includes zip-level metrics (gross rental yield, rent-to-price ratio, gross rent
          multiplier), interactive maps, cash flow calculators, saved searches, and related features
          subject to your subscription tier.
        </p>
        <p>
          ROIScout is an analytics and research tool only. We do not provide investment advice,
          brokerage services, or property management services of any kind.
        </p>
      </Section>

      <Section n="3" title="Market Data & Disclaimer">
        <p>
          Market data displayed in the Service is sourced from third-party public datasets including
          Zillow Research (ZHVI home values and ZORI asking rents), HUD Fair Market Rents, and
          U.S. Census Bureau data. Data is updated on a monthly basis as new releases become available.
        </p>
        <p>
          <strong>ROIScout does not guarantee the accuracy, completeness, or timeliness of any data.</strong>{' '}
          Data may contain errors, omissions, or delays. Zip-level metrics are statistical estimates
          and may not reflect conditions for any specific property. Always verify data independently
          and consult qualified professionals before making investment decisions.
        </p>
        <p>
          ROIScout is not responsible for any investment loss, financial outcome, or other consequence
          arising from reliance on data or analytics provided through the Service.
        </p>
      </Section>

      <Section n="4" title="Subscriptions, Billing & Cancellation">
        <p>
          Paid subscription tiers (Basic, Pro) are billed on a monthly or annual basis via Stripe.
          Prices are shown in USD. You may cancel your subscription at any time through your billing
          settings or by contacting us; access to paid features continues until the end of the
          current billing period. We do not provide prorated refunds for mid-period cancellations
          unless required by applicable law.
        </p>
        <p>
          We reserve the right to change pricing with reasonable notice. If pricing changes, we will
          notify you at least 14 days before the change takes effect on your account.
        </p>
      </Section>

      <Section n="5" title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Scrape, copy, or systematically extract data from the Service for redistribution or resale</li>
          <li>Share account credentials or allow unauthorized access to your account</li>
          <li>Use the Service to build a competing product or service</li>
          <li>Circumvent rate limits, access controls, or subscription restrictions</li>
          <li>Use automated bots or scripts to access the Service in a manner that degrades performance for other users</li>
        </ul>
        <p>
          Violation of these terms may result in immediate suspension or termination of your account
          without refund.
        </p>
      </Section>

      <Section n="6" title="Intellectual Property">
        <p>
          The ROIScout platform, including its code, design, analytics methodology, and presentation
          of data, is owned by ROIScout and its operators. The underlying third-party datasets
          (Zillow, HUD, Census) remain the property of their respective owners and are subject to
          their respective licenses and terms.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable license to use the Service
          for your own personal investment research. No other rights are granted.
        </p>
      </Section>

      <Section n="7" title="Disclaimer of Warranties">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express
          or implied. We do not warrant that the Service will be uninterrupted, error-free, or free
          of security vulnerabilities. Use the Service at your own risk.
        </p>
      </Section>

      <Section n="8" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, ROIScout and its operators shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages — including
          lost profits, lost data, or investment losses — arising from your use of or inability to use
          the Service, even if we have been advised of the possibility of such damages.
        </p>
        <p>
          Our total aggregate liability to you for any claim arising from these terms or the Service
          shall not exceed the amount you paid to ROIScout in the 12 months preceding the claim.
        </p>
      </Section>

      <Section n="9" title="Governing Law">
        <p>
          These Terms are governed by and construed in accordance with the laws of the United States.
          Any disputes arising under these Terms will be resolved through binding arbitration or in
          courts of competent jurisdiction, as applicable.
        </p>
      </Section>

      <Section n="10" title="Contact">
        <p>
          Questions about these Terms? Contact us through the ROIScout website or your account
          settings. We aim to respond within 5 business days.
        </p>
      </Section>

      <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-sm">
        <Link to="/" className="text-green-600 hover:text-green-700 font-medium">← Back to home</Link>
        <Link to="/privacy" className="text-slate-500 hover:text-slate-700">Privacy Policy</Link>
      </div>
    </div>
  </div>
);

export default TermsOfService;
