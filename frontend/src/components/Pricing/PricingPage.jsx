import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const ANNUAL_DISCOUNT = 0.20; // 20% off

const PricingPage = ({ user }) => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [plansRes, subRes] = await Promise.all([
          apiService.getStripePlans(),
          user
            ? apiService.getSubscription().catch(() => ({ subscription: null }))
            : Promise.resolve({ subscription: null }),
        ]);
        if (!cancelled) {
          setPlans(plansRes.plans || []);
          setSubscription(subRes.subscription || null);
        }
      } catch (e) {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') {
      navigate('/signup');
      return;
    }
    if (!user) {
      navigate('/signup');
      return;
    }
    setCheckoutLoading(plan.id);
    try {
      const { url } = await apiService.createCheckoutSession({
        planId: plan.id,
        successUrl: `${window.location.origin}/dashboard?subscription=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
      setCheckoutLoading(null);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const { url } = await apiService.createBillingPortalSession();
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
    }
  };

  const effectivePrice = (plan) => {
    if (plan.price === 0) return 0;
    return annual ? plan.price * (1 - ANNUAL_DISCOUNT) : plan.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlanId = subscription?.status === 'active' ? subscription.planId : 'free';

  // Use plans from API, or fall back to hardcoded tiers if API returns nothing
  const displayPlans = plans.length ? plans : [
    {
      id: 'free', name: 'Free', price: 0, interval: 'month',
      features: ['Browse the national heatmap', '10 zip code detail views/month', 'Core metrics: yield, GRM, rent-to-price'],
      stripePriceId: null,
    },
    {
      id: 'basic', name: 'Basic', price: 19.99, interval: 'month',
      features: ['Unlimited zip code views', 'Unlimited saved searches', 'Full metrics suite', 'Email support'],
      stripePriceId: null,
    },
    {
      id: 'pro', name: 'Pro', price: 79.99, interval: 'month',
      features: ['Everything in Basic', 'CSV export', 'Email alerts on yield thresholds', 'Priority support'],
      stripePriceId: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600 mb-8">
            Start free. Upgrade when you need more.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : ''}`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1.5 bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {displayPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPro = plan.id === 'pro';
            const isFree = plan.id === 'free';
            const price = effectivePrice(plan);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 bg-white flex flex-col ${
                  isPro
                    ? 'border-green-500 shadow-xl'
                    : isCurrent
                    ? 'border-blue-400 shadow-md'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {/* Popular badge */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most popular among active investors
                    </span>
                  </div>
                )}

                {/* Plan name + current badge */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-1">
                  {isFree ? (
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">${price.toFixed(2)}</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                      {annual && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          billed ${(price * 12).toFixed(0)}/year
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1 mt-6">
                  {(plan.features || []).map((f, i) => (
                    <li key={i} className="flex items-start text-gray-700 text-sm">
                      <span className="text-green-500 mr-2 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {isFree && (
                    <>
                      <li className="flex items-start text-gray-400 text-sm line-through">
                        <span className="mr-2 mt-0.5 flex-shrink-0">✗</span>
                        Saved searches
                      </li>
                      <li className="flex items-start text-gray-400 text-sm line-through">
                        <span className="mr-2 mt-0.5 flex-shrink-0">✗</span>
                        CSV export
                      </li>
                    </>
                  )}
                </ul>

                {/* CTA */}
                {user ? (
                  isCurrent ? (
                    <button
                      onClick={handleBillingPortal}
                      className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Manage subscription
                    </button>
                  ) : isFree ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-medium text-center text-sm">
                      Your current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!checkoutLoading || (!plan.stripePriceId)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                        isPro
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {checkoutLoading === plan.id
                        ? 'Redirecting…'
                        : plan.stripePriceId
                        ? 'Subscribe'
                        : 'Coming soon'}
                    </button>
                  )
                ) : isFree ? (
                  <Link
                    to="/signup"
                    className="block w-full py-3 px-4 rounded-xl font-semibold text-center bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                  >
                    Get started free
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-colors ${
                      isPro
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Subscribe
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / trust row */}
        <div className="grid md:grid-cols-3 gap-6 text-center text-sm text-gray-500 mb-10">
          <div>
            <div className="font-semibold text-gray-700 mb-1">Cancel anytime</div>
            No contracts. Downgrade or cancel from your billing settings.
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Buy-and-hold friendly</div>
            Monthly billing as default — don't pay during dormant search periods.
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Data updated monthly</div>
            Zillow ZHVI home values + ZORI asking rents. 8,000+ zip codes tracked.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-green-600 hover:text-green-700 font-medium text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
