import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Percent, Map, Star } from 'lucide-react';
import DataDisclaimer from '../Shared/DataDisclaimer';
import LandingHeatmap from './LandingHeatmap';
import { apiService } from '../../services/api';

const SimpleLandingPage = () => {
  const [email, setEmail]           = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try { await apiService.subscribe(email); } catch {}
    finally { setIsSubmitted(true); setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 min-h-[85vh] flex flex-col justify-center px-6 overflow-hidden">
        {/* Faint green radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(22,163,74,0.12)_0%,_transparent_60%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-4">
            Zip-level rental market intelligence
          </p>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Find the best rental markets{' '}
            <span className="text-green-400">before everyone else.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Zip-level gross yields, rent-to-price ratios, cash flow projections, and GRM for 8,000+ markets across the US.
            Updated monthly from Zillow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-green-600 hover:bg-green-500 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live sample heatmap ──────────────────────────────────────────── */}
      <section className="bg-slate-900 px-6 pb-20" aria-label="Live sample heatmap">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Live sample — zip-level ROI</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real data · Green = stronger yield · "1%" = meets the 1% rule</p>
              </div>
              <Link to="/signup" className="text-green-400 hover:text-green-300 text-sm font-medium">
                See full map & filters →
              </Link>
            </div>
            <LandingHeatmap />
          </div>
        </div>
      </section>

      {/* ── How investors use it ─────────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 px-6 py-20" aria-label="Use cases">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10 tracking-tight">How investors use ROIScout</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Percent,
                title: 'Markets that meet the 1% rule',
                body: 'Filter by rent-to-price ratio and gross yield to find zip codes where monthly rent meets or exceeds 1% of purchase price.',
              },
              {
                Icon: Map,
                title: 'Compare markets across states',
                body: 'Use the heat map and ROI table to compare median prices, rents, and yields across counties and states — all in one place.',
              },
              {
                Icon: Star,
                title: 'Personal cash flow projections',
                body: 'Enter your down payment, interest rate, and expense reserves. ROIScout ranks every market by your actual cash-on-cash return.',
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why I built this ─────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-6 py-20" aria-label="About">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Why I built this</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Real estate investment research is broken. Not because the data doesn't exist — it's all out there.
            It's because getting to a single answer requires pulling it from five different places, running the
            math yourself, and starting over every time you look at a new market.
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            I spent years doing exactly that. Open a tab for active rentals, another for sale listings,
            cross-reference the two, open a spreadsheet, run the numbers. Repeat for every zip code worth
            evaluating. It worked — but it was slow, manual, and it never got faster.
          </p>
          <p className="text-slate-300 leading-relaxed mb-10">
            What I wanted was one tool that already knew what rent-to-price ratios looked like across every
            US market, had the yield math done, and let me filter to what actually penciled. That tool didn't
            exist. So I built it.
          </p>

          <div className="border-t border-slate-700 pt-8 flex flex-wrap gap-10">
            {[
              { n: '1,000+', label: 'Deals analyzed' },
              { n: '8,000+', label: 'Markets tracked' },
              { n: '36',     label: 'States covered' },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-green-400">{n}</div>
                <div className="text-sm text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stay updated ─────────────────────────────────────────────────── */}
      <section className="bg-green-600 px-6 py-16 text-center" aria-label="Email signup">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3">Stay Updated</h2>
          <p className="text-green-100 mb-7 text-sm leading-relaxed">
            New features, market insights, and launch news. No spam.
          </p>
          {!isSubmitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-white hover:bg-green-50 text-green-700 font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm whitespace-nowrap"
              >
                {submitting ? 'Saving…' : 'Subscribe'}
              </button>
            </form>
          ) : (
            <div className="bg-white/20 text-white px-6 py-3 rounded-lg inline-block text-sm font-medium">
              ✓ Thanks — we'll be in touch.
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 px-6 py-8 text-center">
        <DataDisclaimer className="max-w-xl mx-auto mb-4" />
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link to="/terms"   className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
        </div>
        <p className="mt-4 text-slate-500 text-xs">© 2026 ROIScout. Built for real estate investors.</p>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;
