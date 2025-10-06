import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, deleteAuthUser, logoutUser } from '../../services/authService';
import { exportUserData, deleteAllUserData } from '../../services/transactionService';
import Toast from '../UI/Toast';
import ConfirmDialog from '../UI/ConfirmDialog';
// ReAuthDialog removed - reauthentication flow is disabled for account deletion
import { 
  Moon, 
  Sun, 
  Globe, 
  DollarSign, 
  Save,
  Smartphone,
  Palette,
  Download,
  Trash2
} from 'lucide-react';

const SettingsModal = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [settings, setSettings] = useState({
    currency: userProfile?.currency || 'BDT',
    language: userProfile?.language || 'en',
    monthlyBudget: userProfile?.monthlyBudget || '',
    budgetAlerts: userProfile?.budgetAlerts !== false,
    theme: userProfile?.theme || 'system'
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  

  const handleThemeChange = async (theme) => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    
    // Apply theme immediately to DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Save theme preference immediately to prevent reverting on refresh
    try {
      const payload = {
        currency: newSettings.currency,
        language: newSettings.language,
        monthlyBudget: newSettings.monthlyBudget ? Number(newSettings.monthlyBudget) : null,
        budgetAlerts: newSettings.budgetAlerts,
        theme: newSettings.theme
      };

      const result = await updateUserProfile(user.uid, payload);
      if (result.success) {
        // Refresh user profile to sync with saved data
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Only log the change, don't apply immediately
    if (key === 'language') {
      console.log('Language selected:', value, '(will apply when saved)');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sanitize settings payload: only send supported keys to the backend
      const payload = {
        currency: settings.currency,
        language: settings.language,
        monthlyBudget: settings.monthlyBudget ? Number(settings.monthlyBudget) : null,
        budgetAlerts: settings.budgetAlerts,
        theme: settings.theme
      };

      const result = await updateUserProfile(user.uid, payload);
      if (result.success) {
        // Refresh user profile to sync with saved data
        await refreshUserProfile();
        setToast({ open: true, message: 'Settings saved successfully!', type: 'info' });
        
        // Refresh the page after a short delay to allow toast to show
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setSaving(true);
    try {
      const res = await exportUserData(user.uid);
      if (!res.success) throw new Error(res.error || 'Failed to export');

      const payload = res.data;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-data-${user.uid}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ open: true, message: 'Export started, check your downloads', type: 'info' });
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ open: true, message: `Export failed: ${error.message || error}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteConfirmOpen(false);
    setSaving(true);
    try {
      const delRes = await deleteAllUserData(user.uid);
      if (!delRes.success) throw new Error(delRes.error || 'Failed to delete user data');

      const authRes = await deleteAuthUser();
      if (!authRes.success) {
        // If the backend indicates the user must re-authenticate (Firebase recent login requirement),
        // inform the user how to proceed since we removed inline re-auth flow.
        const code = authRes.code || authRes.errorCode || '';
        const msg = authRes.error || authRes.message || '';
        if (code === 'auth/requires-recent-login' || /recent/i.test(msg)) {
          setToast({
            open: true,
            message: 'Account deletion requires recent authentication. Please sign out and sign in again, then try deleting your account.',
            type: 'error'
          });
        } else {
          setToast({ open: true, message: `Account deletion failed: ${authRes.error || authRes.message || 'Unknown error'}`, type: 'error' });
        }
      } else {
        setToast({ open: true, message: 'Account deleted successfully', type: 'info' });
        // Ensure auth state is cleared and reload app to reflect signed-out state
        try {
          await logoutUser();
        } catch (err) {
          console.warn('Failed to sign out after account deletion:', err);
        }
        // Give the toast a moment to render, then reload
        setTimeout(() => {
          window.location.reload();
        }, 700);
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      setToast({ open: true, message: `Delete failed: ${error.message || error}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Theme & Appearance</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-3 rounded-lg border-2 transition-all ${
              settings.theme === 'light'
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-3 rounded-lg border-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('system')}
            className={`p-3 rounded-lg border-2 transition-all ${
              settings.theme === 'system'
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Smartphone className="w-5 h-5 mx-auto mb-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System</span>
          </button>
        </div>
      </div>

      {/* Currency & Budget Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Currency & Budget</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingsChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Budget
            </label>
            <input
              type="number"
              value={settings.monthlyBudget}
              onChange={(e) => handleSettingsChange('monthlyBudget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your monthly budget"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget Alerts</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when you exceed 80% of your budget</p>
            </div>
            <button
              onClick={() => handleSettingsChange('budgetAlerts', !settings.budgetAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.budgetAlerts ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.budgetAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings removed per user request */}

      {/* Language Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Language & Region</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingsChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="en">English</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
          </select>
        </div>
      </div>

      {/* Data & Account */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Smartphone className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Data & Account</h3>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={saving}
            className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <div className="text-left">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Export Data</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Download all your data in JSON format</p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              →
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <span className="text-sm font-medium text-red-900 dark:text-red-300">Delete Account</span>
                <p className="text-xs text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
              </div>
            </div>
            <div className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              →
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
      
      {/* Confirm dialog for account deletion */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete account"
        description="This will permanently delete your account data from the server. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Re-auth removed: direct deletion flow (no password prompt) */}
    </div>
  );
};

export default SettingsModal;