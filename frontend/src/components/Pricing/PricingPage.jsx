import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const PricingPage = ({ user }) => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [plansRes, subRes] = await Promise.all([
          apiService.getStripePlans(),
          user ? apiService.getSubscription().catch(() => ({ subscription: null })) : Promise.resolve({ subscription: null }),
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

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    setCheckoutLoading(planId);
    try {
      const { url } = await apiService.createCheckoutSession({
        planId,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlanId = subscription?.status === 'active' ? subscription.planId : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Pricing</h1>
        <p className="text-gray-600 text-center mb-10">
          Choose the plan that fits your investing workflow.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPro = plan.id === 'pro';
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-8 bg-white ${
                  isPro ? 'border-green-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      Current plan
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${Number(plan.price).toFixed(2)}</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {user ? (
                  isCurrent ? (
                    <button
                      onClick={handleBillingPortal}
                      className="w-full py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Manage subscription
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!checkoutLoading || !plan.stripePriceId}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPro
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {checkoutLoading === plan.id
                        ? 'Redirecting…'
                        : plan.stripePriceId
                        ? `Subscribe to ${plan.name}`
                        : 'Coming soon'}
                    </button>
                  )
                ) : (
                  <Link
                    to="/signup"
                    className={`block w-full py-3 px-4 rounded-lg font-medium text-center ${
                      isPro ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    Sign up to subscribe
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {!plans.length && (
          <p className="text-center text-gray-500">
            Pricing plans are being configured. Check back soon.
          </p>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
