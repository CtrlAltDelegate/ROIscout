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

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-slate-50 py-12 px-4">
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10">
      <div className="mb-8">
        <Link to="/" className="text-sm font-bold mb-6 inline-block">
          <span className="text-green-600">ROI</span><span className="text-slate-900">Scout</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mt-1">Last updated: May 2026</p>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        ROIScout takes your privacy seriously. This policy explains what data we collect, why we
        collect it, and how we protect it. We do not sell your personal information.
      </p>

      <Section n="1" title="Information We Collect">
        <p><strong>Account information:</strong> When you sign up, we collect your email address
        and a hashed version of your password. If you sign in with Google, we receive your email
        and profile name from Google — we never see or store your Google password.</p>

        <p><strong>Usage data:</strong> We log which features you use (e.g., which states and
        filters you search, how often you access the dashboard) to improve the product. We do not
        track activity outside of ROIScout.</p>

        <p><strong>Saved searches:</strong> If you save a search, we store the filter parameters
        you specified so you can reload them later.</p>

        <p><strong>Payment data:</strong> Payments are processed by Stripe. We do not store full
        payment card numbers, CVVs, or bank details. We receive only a Stripe customer ID and
        subscription status from Stripe.</p>

        <p><strong>Email list:</strong> If you submit your email on our landing page, we store it
        solely to notify you of product updates and launch news. You can unsubscribe at any time.</p>

        <p><strong>Market data:</strong> The zip-level data you view (median prices, rents, yields)
        is sourced from public third-party datasets (Zillow, HUD, Census Bureau). This data is not
        personal information.</p>
      </Section>

      <Section n="2" title="How We Use Your Information">
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>To operate and improve the Service</li>
          <li>To process payments and manage your subscription via Stripe</li>
          <li>To send transactional emails (password resets, subscription confirmations)</li>
          <li>To send product updates and yield alerts you opt into (Pro subscribers)</li>
          <li>To detect and prevent abuse or unauthorized access</li>
          <li>To comply with applicable laws and regulations</li>
        </ul>
        <p>
          We do not use your data for advertising, do not share it with advertising networks,
          and do not build behavioral profiles for sale.
        </p>
      </Section>

      <Section n="3" title="Data Sharing & Third Parties">
        <p>We share data only as strictly necessary to operate the Service:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Stripe</strong> — payment processing and subscription management</li>
          <li><strong>Resend</strong> — transactional and alert email delivery</li>
          <li><strong>Railway</strong> — cloud hosting for our backend and database</li>
          <li><strong>Netlify</strong> — static hosting for the frontend application</li>
          <li><strong>Sentry</strong> — error monitoring (anonymized stack traces only)</li>
        </ul>
        <p>
          We do not sell, rent, or trade your personal information to any third party. We may
          disclose information if required by law, court order, or to protect the rights and
          safety of ROIScout and its users.
        </p>
      </Section>

      <Section n="4" title="Data Retention">
        <p>
          We retain your account data for as long as your account is active. If you delete your
          account, we will delete your personal information within 30 days, except where we are
          required to retain it for legal or financial record-keeping purposes (e.g., payment
          history for up to 7 years).
        </p>
        <p>
          Email list subscribers are retained until you unsubscribe or request deletion.
        </p>
      </Section>

      <Section n="5" title="Security">
        <p>
          We use industry-standard security measures including TLS encryption in transit,
          bcrypt password hashing, and access controls on our database and infrastructure.
          However, no system is completely secure. You are responsible for keeping your login
          credentials confidential. Notify us immediately if you suspect unauthorized access
          to your account.
        </p>
      </Section>

      <Section n="6" title="Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Access</strong> the personal data we hold about you</li>
          <li><strong>Correct</strong> inaccurate data in your account</li>
          <li><strong>Delete</strong> your account and associated data</li>
          <li><strong>Opt out</strong> of marketing emails at any time via the unsubscribe link</li>
          <li><strong>Data portability</strong> — request an export of your saved searches and account data</li>
        </ul>
        <p>
          To exercise any of these rights, contact us through your account settings or the
          ROIScout website. We will respond within 30 days.
        </p>
      </Section>

      <Section n="7" title="Cookies & Tracking">
        <p>
          We use a minimal set of cookies: an authentication cookie to keep you logged in, and
          local storage to remember your dashboard preferences. We do not use third-party
          advertising cookies or tracking pixels.
        </p>
        <p>
          You can clear cookies through your browser settings. Clearing the auth cookie will
          log you out.
        </p>
      </Section>

      <Section n="8" title="Children's Privacy">
        <p>
          ROIScout is not directed to children under 13. We do not knowingly collect personal
          information from children. If you believe a child has provided us personal information,
          please contact us and we will delete it promptly.
        </p>
      </Section>

      <Section n="9" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy
          on this page and update the "Last updated" date. For material changes, we will notify
          you via email or a prominent notice in the Service. Continued use after changes
          constitutes acceptance.
        </p>
      </Section>

      <Section n="10" title="Contact">
        <p>
          Privacy questions or requests? Contact us through the ROIScout website or your account
          settings. We aim to respond within 5 business days.
        </p>
      </Section>

      <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-sm">
        <Link to="/" className="text-green-600 hover:text-green-700 font-medium">← Back to home</Link>
        <Link to="/terms" className="text-slate-500 hover:text-slate-700">Terms of Service</Link>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
