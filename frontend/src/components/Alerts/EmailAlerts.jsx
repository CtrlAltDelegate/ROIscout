import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Home,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react';

const EmailAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [newAlert, setNewAlert] = useState({
    name: '',
    market: '',
    zipCode: '',
    minRatio: '',
    maxPrice: '',
    propertyType: '',
    frequency: 'daily',
    active: true
  });

  // Mock existing alerts
  useEffect(() => {
    setAlerts([
      {
        id: 1,
        name: 'Indianapolis High ROI Deals',
        market: 'Indianapolis, IN',
        zipCode: '46201,46202,46203',
        minRatio: 7.0,
        maxPrice: 200000,
        propertyType: 'Single Family',
        frequency: 'daily',
        active: true,
        created: '2024-01-15',
        lastTriggered: '2024-01-20',
        matchCount: 3
      },
      {
        id: 2,
        name: 'Kansas City Duplex Opportunities',
        market: 'Kansas City, MO',
        zipCode: '',
        minRatio: 6.5,
        maxPrice: 180000,
        propertyType: 'Multi-Family',
        frequency: 'weekly',
        active: true,
        created: '2024-01-10',
        lastTriggered: '2024-01-18',
        matchCount: 1
      },
      {
        id: 3,
        name: 'Nashville Investment Properties',
        market: 'Nashville, TN',
        zipCode: '37206,37208',
        minRatio: 5.5,
        maxPrice: 300000,
        propertyType: 'Any',
        frequency: 'daily',
        active: false,
        created: '2024-01-05',
        lastTriggered: '2024-01-15',
        matchCount: 0
      }
    ]);
  }, []);

  const markets = [
    'Indianapolis, IN',
    'Kansas City, MO',
    'Nashville, TN',
    'Atlanta, GA',
    'Phoenix, AZ',
    'Tampa, FL',
    'Charlotte, NC',
    'Memphis, TN'
  ];

  const propertyTypes = [
    'Any',
    'Single Family',
    'Multi-Family',
    'Condo',
    'Townhouse'
  ];

  const frequencies = [
    { value: 'immediate', label: 'Immediate (as found)' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Summary' },
    { value: 'monthly', label: 'Monthly Report' }
  ];

  const handleCreateAlert = () => {
    if (!newAlert.name || !newAlert.market || !newAlert.minRatio) {
      alert('Please fill in required fields');
      return;
    }

    const alert = {
      id: Date.now(),
      ...newAlert,
      minRatio: parseFloat(newAlert.minRatio),
      maxPrice: newAlert.maxPrice ? parseInt(newAlert.maxPrice) : null,
      created: new Date().toISOString().split('T')[0],
      lastTriggered: null,
      matchCount: 0
    };

    setAlerts(prev => [...prev, alert]);
    setNewAlert({
      name: '',
      market: '',
      zipCode: '',
      minRatio: '',
      maxPrice: '',
      propertyType: '',
      frequency: 'daily',
      active: true
    });
    setShowCreateForm(false);
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setNewAlert({
      name: alert.name,
      market: alert.market,
      zipCode: alert.zipCode,
      minRatio: alert.minRatio.toString(),
      maxPrice: alert.maxPrice?.toString() || '',
      propertyType: alert.propertyType,
      frequency: alert.frequency,
      active: alert.active
    });
    setShowCreateForm(true);
  };

  const handleUpdateAlert = () => {
    if (!newAlert.name || !newAlert.market || !newAlert.minRatio) {
      alert('Please fill in required fields');
      return;
    }

    const updatedAlert = {
      ...editingAlert,
      ...newAlert,
      minRatio: parseFloat(newAlert.minRatio),
      maxPrice: newAlert.maxPrice ? parseInt(newAlert.maxPrice) : null
    };

    setAlerts(prev => prev.map(a => a.id === editingAlert.id ? updatedAlert : a));
    setEditingAlert(null);
    setNewAlert({
      name: '',
      market: '',
      zipCode: '',
      minRatio: '',
      maxPrice: '',
      propertyType: '',
      frequency: 'daily',
      active: true
    });
    setShowCreateForm(false);
  };

  const handleDeleteAlert = (id) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const toggleAlertStatus = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    ));
  };

  const getStatusColor = (alert) => {
    if (!alert.active) return 'text-gray-500';
    if (alert.matchCount > 0) return 'text-emerald-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (alert) => {
    if (!alert.active) return Clock;
    if (alert.matchCount > 0) return CheckCircle;
    return AlertCircle;
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      immediate: 'bg-red-100 text-red-800',
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-purple-100 text-purple-800',
      monthly: 'bg-gray-100 text-gray-800'
    };
    return colors[frequency] || colors.daily;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Alerts</h1>
              <p className="text-gray-600 mt-1">Get notified when properties match your criteria</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Active Alerts</div>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {alerts.filter(a => a.active).length}
          </div>
          <div className="text-sm text-gray-500">
            {alerts.length} total alerts
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Properties Found</div>
            <Home className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {alerts.reduce((sum, a) => sum + a.matchCount, 0)}
          </div>
          <div className="text-sm text-gray-500">
            This week
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg ROI Target</div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {alerts.length > 0 ? (alerts.reduce((sum, a) => sum + a.minRatio, 0) / alerts.length).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-500">
            Across all alerts
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Emails Sent</div>
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {alerts.filter(a => a.lastTriggered).length * 3}
          </div>
          <div className="text-sm text-gray-500">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Create/Edit Alert Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingAlert(null);
                setNewAlert({
                  name: '',
                  market: '',
                  zipCode: '',
                  minRatio: '',
                  maxPrice: '',
                  propertyType: '',
                  frequency: 'daily',
                  active: true
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Name *
                </label>
                <input
                  type="text"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Indianapolis High ROI Deals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market *
                </label>
                <select
                  value={newAlert.market}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, market: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a market</option>
                  {markets.map(market => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Codes (optional)
                </label>
                <input
                  type="text"
                  value={newAlert.zipCode}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="e.g., 46201,46202,46203"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of zip codes to monitor
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={newAlert.propertyType}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum ROI (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlert.minRatio}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, minRatio: e.target.value }))}
                  placeholder="e.g., 7.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price (optional)
                </label>
                <input
                  type="number"
                  value={newAlert.maxPrice}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, maxPrice: e.target.value }))}
                  placeholder="e.g., 200000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Frequency
                </label>
                <select
                  value={newAlert.frequency}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={newAlert.active}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Activate alert immediately
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingAlert(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingAlert ? handleUpdateAlert : handleCreateAlert}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {editingAlert ? 'Update Alert' : 'Create Alert'}
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Alerts</h2>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
            <p className="text-gray-600 mb-6">Create your first alert to get notified about great deals</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => {
              const StatusIcon = getStatusIcon(alert);
              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyBadge(alert.frequency)}`}>
                          {frequencies.find(f => f.value === alert.frequency)?.label}
                        </span>
                        <div className={`flex items-center ${getStatusColor(alert)}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">
                            {!alert.active ? 'Paused' : alert.matchCount > 0 ? 'Active' : 'Monitoring'}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {alert.market}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Min ROI: {alert.minRatio}%
                        </div>
                        {alert.maxPrice && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Max: ${alert.maxPrice.toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Home className="w-4 h-4 mr-1" />
                          {alert.propertyType}
                        </div>
                      </div>

                      {alert.zipCode && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Zip Codes:</strong> {alert.zipCode}
                        </div>
                      )}

                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {new Date(alert.created).toLocaleDateString()}</span>
                        {alert.lastTriggered && (
                          <span>Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}</span>
                        )}
                        <span>{alert.matchCount} properties found</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleAlertStatus(alert.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          alert.active 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {alert.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditAlert(alert)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Settings */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Settings</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="digest"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="digest" className="ml-2 block text-sm text-gray-700">
              Receive weekly market digest
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="tips"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="tips" className="ml-2 block text-sm text-gray-700">
              Receive investment tips and educational content
            </label>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailAlerts;
