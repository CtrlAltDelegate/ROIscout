import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, RefreshCw, ShieldCheck, Database } from 'lucide-react';
import { apiService } from '../../services/api';

const ANNUAL_DISCOUNT = 0.20;

const PricingPage = ({ user }) => {
  const [plans, setPlans]                   = useState([]);
  const [subscription, setSubscription]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [annual, setAnnual]                 = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [plansRes, subRes] = await Promise.all([
          apiService.getStripePlans(),
          user ? apiService.getSubscription().catch(() => ({ subscription: null })) : Promise.resolve({ subscription: null }),
        ]);
        if (!cancelled) { setPlans(plansRes.plans || []); setSubscription(subRes.subscription || null); }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') { navigate('/signup'); return; }
    if (!user) { navigate('/signup'); return; }
    setCheckoutLoading(plan.id);
    try {
      const { url } = await apiService.createCheckoutSession({
        planId: plan.id,
        successUrl: `${window.location.origin}/dashboard?subscription=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      if (url) window.location.href = url;
    } catch { setCheckoutLoading(null); }
  };

  const handleBillingPortal = async () => {
    try {
      const { url } = await apiService.createBillingPortalSession();
      if (url) window.location.href = url;
    } catch {}
  };

  const effectivePrice = (plan) => plan.price === 0 ? 0 : annual ? plan.price * (1 - ANNUAL_DISCOUNT) : plan.price;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlanId = subscription?.status === 'active' ? subscription.planId : 'free';
  const displayPlans = plans.length ? plans : [
    { id: 'free',  name: 'Free',  price: 0,     interval: 'month', stripePriceId: null,
      features: ['Browse the national heatmap', '10 zip code detail views/month', 'Core metrics: yield, GRM, rent-to-price'] },
    { id: 'basic', name: 'Basic', price: 19.99, interval: 'month', stripePriceId: null,
      features: ['Unlimited zip code views', 'Unlimited saved searches', 'Full metrics suite', 'Cash flow calculator', 'Email support'] },
    { id: 'pro',   name: 'Pro',   price: 79.99, interval: 'month', stripePriceId: null,
      features: ['Everything in Basic', 'CSV export', 'Email alerts on yield thresholds', 'Priority support'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark hero band */}
      <div className="bg-slate-900 pt-16 pb-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(22,163,74,0.12)_0%,_transparent_60%)]" />
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Simple, transparent pricing</h1>
          <p className="text-slate-400 text-lg mb-8">Start free. Upgrade when you need more.</p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-800 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Annual
              <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards — overlap the dark band */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 pb-16">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {displayPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPro     = plan.id === 'pro';
            const isFree    = plan.id === 'free';
            const price     = effectivePrice(plan);

            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border p-7 flex flex-col shadow-sm ${
                isPro ? 'border-green-500 ring-2 ring-green-500/20 shadow-md' : 'border-slate-200'
              }`}>
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  {isFree ? (
                    <span className="text-4xl font-bold text-slate-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-slate-900">${price.toFixed(2)}</span>
                      <span className="text-slate-400 text-lg font-normal">/mo</span>
                      {annual && <div className="text-xs text-slate-400 mt-0.5">billed ${(price * 12).toFixed(0)}/yr</div>}
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {(plan.features || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {isFree && (
                    <>
                      <li className="flex items-start gap-2 text-sm text-slate-300 line-through">
                        <span className="w-[15px] flex-shrink-0" />Saved searches
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300 line-through">
                        <span className="w-[15px] flex-shrink-0" />CSV export
                      </li>
                    </>
                  )}
                </ul>

                {/* CTA */}
                {user ? (
                  isCurrent ? (
                    <button
                      onClick={handleBillingPortal}
                      className="w-full py-3 rounded-xl border-2 border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                    >
                      Manage subscription
                    </button>
                  ) : isFree ? (
                    <div className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-400 font-medium text-center text-sm">
                      Your current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!checkoutLoading || !plan.stripePriceId}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPro ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {checkoutLoading === plan.id ? 'Redirecting…' : plan.stripePriceId ? 'Subscribe' : 'Coming soon'}
                    </button>
                  )
                ) : isFree ? (
                  <Link to="/signup" className="block w-full py-3 rounded-xl font-semibold text-center bg-slate-900 hover:bg-slate-800 text-white transition-colors text-sm">
                    Get started free
                  </Link>
                ) : (
                  <Link to="/signup" className={`block w-full py-3 rounded-xl font-semibold text-center transition-colors text-sm ${
                    isPro ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}>
                    Subscribe
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="grid md:grid-cols-3 gap-6 text-center mb-10">
          {[
            { Icon: ShieldCheck, title: 'Cancel anytime', body: 'No contracts. Downgrade or cancel from your billing settings.' },
            { Icon: RefreshCw,   title: 'Buy-and-hold friendly', body: "Monthly billing — don't pay during dormant search periods." },
            { Icon: Database,    title: 'Data updated monthly', body: 'Zillow ZHVI + ZORI. 8,000+ zip codes tracked nationwide.' },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <Icon size={18} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">{title}</p>
              <p className="text-sm text-slate-500">{body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/" className="text-green-600 hover:text-green-700 font-medium text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
