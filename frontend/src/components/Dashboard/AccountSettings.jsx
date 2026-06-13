import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import { apiService } from '../../services/api';

export default function AccountSettings({ user, onClose }) {
  const [alertsEnabled,  setAlertsEnabled]  = useState(true);
  const [threshold,      setThreshold]      = useState(8.0);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(true);

  const isPro = ['pro', 'Pro'].includes(user?.subscription_plan || user?.plan);

  useEffect(() => {
    apiService.getAlertSettings()
      .then(data => {
        setAlertsEnabled(data.alerts_enabled);
        setThreshold(data.alert_threshold ?? 8.0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiService.updateAlertSettings({
        alerts_enabled:  alertsEnabled,
        alert_threshold: parseFloat(threshold),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Account Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* User info */}
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{user?.email}</span>
            <span className="ml-2 inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
              {user?.subscription_plan || user?.plan || 'free'}
            </span>
          </div>

          {/* Alert settings — Pro only */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Yield Alert Emails</p>

            {!isPro ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
                Alert emails are available on the <span className="font-medium text-slate-700">Pro plan</span>.
                When a market in your saved searches crosses your yield threshold, we'll send you a digest.
              </div>
            ) : loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    {alertsEnabled ? <Bell size={15} className="text-green-500" /> : <BellOff size={15} className="text-slate-400" />}
                    <span>{alertsEnabled ? 'Alerts enabled' : 'Alerts disabled'}</span>
                  </div>
                  <button
                    onClick={() => setAlertsEnabled(v => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      alertsEnabled ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={alertsEnabled}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        alertsEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Threshold */}
                {alertsEnabled && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">
                      Alert threshold: <span className="font-semibold text-slate-700">{parseFloat(threshold).toFixed(1)}% yield</span>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="20"
                      step="0.5"
                      value={threshold}
                      onChange={e => setThreshold(e.target.value)}
                      className="w-full accent-green-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>4%</span>
                      <span className="text-green-600 font-medium">8% default</span>
                      <span>20%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      We'll email you when a saved-search market exceeds this yield.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl py-2 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            {isPro && (
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold rounded-xl py-2 transition-colors"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
