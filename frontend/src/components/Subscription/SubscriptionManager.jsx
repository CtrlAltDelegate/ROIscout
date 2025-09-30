import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, ExternalLink, TrendingUp, Download, Search } from 'lucide-react';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscription();
    fetchUsage();
  }, []);

  const fetchSubscription = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stripe/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      setError('Failed to load subscription details');
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      // This would be a new endpoint to get usage statistics
      const response = await fetch(`${API_BASE_URL}/usage/current-month`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage || []);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stripe/billing-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        throw new Error('Failed to create billing portal session');
      }
    } catch (err) {
      setError('Failed to open billing portal');
      console.error('Error opening billing portal:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stripe/subscription`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchSubscription();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageIcon = (actionType) => {
    switch (actionType) {
      case 'property_search':
        return <Search size={20} className="text-blue-500" />;
      case 'export_csv':
        return <Download size={20} className="text-green-500" />;
      case 'export_pdf':
        return <Download size={20} className="text-red-500" />;
      default:
        return <TrendingUp size={20} className="text-gray-500" />;
    }
  };

  const formatActionType = (actionType) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription & Usage</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Subscription Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CreditCard className="mr-3 text-blue-500" size={24} />
            Current Plan
          </h2>
          {subscription && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          )}
        </div>

        {subscription ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{subscription.plan}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  <span>Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle size={16} className="mr-2" />
                    <span>Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleBillingPortal}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <ExternalLink size={16} className="mr-2" />
                Manage Billing
              </button>
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You're currently on the free plan</p>
            <a
              href="/pricing"
              className="inline-block bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-colors"
            >
              Upgrade Now
            </a>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="mr-3 text-green-500" size={24} />
          This Month's Usage
        </h2>

        {usage.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usage.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getUsageIcon(item.action_type)}
                    <span className="ml-2 font-medium text-gray-900">
                      {formatActionType(item.action_type)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {item.total_usage}
                </div>
                <div className="text-sm text-gray-600">
                  {item.action_count} {item.action_count === 1 ? 'action' : 'actions'}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last used: {new Date(item.last_usage).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No usage data available for this month</p>
            <p className="text-sm text-gray-500 mt-2">Start using ROI Scout to see your usage statistics here</p>
          </div>
        )}
      </div>

      {/* Usage Limits Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Plan Limits</h3>
        <div className="text-sm text-blue-800">
          {subscription ? (
            <p>You're on the <strong>{subscription.plan}</strong> plan with unlimited access to all features.</p>
          ) : (
            <div>
              <p className="mb-2">Free plan limits:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>10 property searches per month</li>
                <li>2 CSV exports per month</li>
                <li>1 PDF export per month</li>
                <li>3 saved searches</li>
              </ul>
              <p className="mt-3">
                <a href="/pricing" className="text-blue-600 hover:text-blue-800 underline">
                  Upgrade to Pro
                </a> for unlimited access to all features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
