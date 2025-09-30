import React, { useState, useEffect } from 'react';
import { Check, X, Star, Zap, Shield, Users } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PricingCard = ({ plan, isPopular, onSelectPlan, currentPlan, loading }) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === 'free';

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
      isPopular ? 'border-green-500 scale-105' : 'border-gray-200'
    } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
            <Star size={16} className="mr-1" />
            Most Popular
          </span>
        </div>
      )}

      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
            <span className="text-gray-600">/{plan.interval}</span>
          </div>
          {isCurrentPlan && (
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Current Plan
            </span>
          )}
        </div>

        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelectPlan(plan)}
          disabled={loading || isCurrentPlan}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            isFree
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              : isPopular
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } ${(loading || isCurrentPlan) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : isFree ? 'Get Started' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  );
};

const CheckoutForm = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentError) {
        setError(paymentError.message);
        setLoading(false);
        return;
      }

      // Create subscription
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stripe/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create subscription');
      }

      if (result.clientSecret) {
        // Confirm payment if required
        const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
        
        if (confirmError) {
          setError(confirmError.message);
          setLoading(false);
          return;
        }
      }

      onSuccess(result);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold mb-6">Subscribe to {plan.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Subscribe $${plan.price}/${plan.interval}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/stripe/plans`);
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/stripe/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subscription && data.subscription.status === 'active') {
          // Determine plan from subscription
          const plan = plans.find(p => p.stripePriceId === data.subscription.priceId) || 
                       { id: 'pro' }; // Default assumption
          setCurrentPlan(plan.id);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') {
      // Handle downgrade to free plan
      handleFreePlan();
    } else {
      setSelectedPlan(plan);
      setShowCheckout(true);
    }
  };

  const handleFreePlan = async () => {
    // In a real app, you might want to cancel the current subscription
    alert('To downgrade to the free plan, please contact support or cancel your subscription in the billing portal.');
  };

  const handleCheckoutSuccess = (result) => {
    setShowCheckout(false);
    setSelectedPlan(null);
    alert('Subscription created successfully! Welcome to ' + selectedPlan?.name + '!');
    fetchCurrentSubscription();
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find profitable real estate investments with our powerful analytics platform. 
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.id === 'pro'}
              onSelectPlan={handleSelectPlan}
              currentPlan={currentPlan}
              loading={loading}
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose ROI Scout?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Get instant ROI calculations and market insights in seconds.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reliable Data</h3>
              <p className="text-gray-600">Access accurate, up-to-date property and rental data.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-gray-600">Get help from our team of real estate investment experts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            plan={selectedPlan}
            onSuccess={handleCheckoutSuccess}
            onCancel={handleCheckoutCancel}
          />
        </Elements>
      )}
    </div>
  );
};

export default PricingPage;
