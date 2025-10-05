import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, deleteAuthUser, reauthenticateUser } from '../../services/authService';
import { exportUserData, deleteAllUserData } from '../../services/transactionService';
import Toast from '../UI/Toast';
import ConfirmDialog from '../UI/ConfirmDialog';
import ReAuthDialog from '../UI/ReAuthDialog';
import { 
  Moon, 
  Sun, 
  Globe, 
  DollarSign, 
  Bell,
  Shield,
  Save,
  Smartphone,
  Palette,
  Download,
  Trash2
} from 'lucide-react';

const SettingsModal = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [settings, setSettings] = useState({
    currency: userProfile?.currency || 'BDT',
    language: userProfile?.language || 'en',
    notifications: userProfile?.notifications !== false,
    emailNotifications: userProfile?.emailNotifications !== false,
    monthlyBudget: userProfile?.monthlyBudget || '',
    budgetAlerts: userProfile?.budgetAlerts !== false,
    theme: userProfile?.theme || 'system'
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState('');

  const handleThemeChange = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    
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
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserProfile(user.uid, settings);
      if (result.success) {
        setUserProfile({ ...userProfile, ...settings });
        setToast({ open: true, message: 'Settings saved successfully!', type: 'info' });
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
        // If the error indicates recent login required, prompt for password and retry
        if (authRes.code === 'auth/requires-recent-login') {
          setReauthError('Please re-enter your password to confirm.');
          setReauthOpen(true);
        } else {
          setToast({ open: true, message: 'Account data removed. Sign-out required to remove authentication.', type: 'info' });
        }
      } else {
        setToast({ open: true, message: 'Account deleted successfully', type: 'info' });
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      setToast({ open: true, message: `Delete failed: ${error.message || error}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReauthConfirm = async (password) => {
    setReauthLoading(true);
    setReauthError('');
    try {
      const r = await reauthenticateUser(password);
      if (!r.success) {
        setReauthError(r.error || 'Reauthentication failed');
        return;
      }

      // Retry auth deletion
      const authRes2 = await deleteAuthUser();
      if (!authRes2.success) {
        setToast({ open: true, message: `Account deletion failed: ${authRes2.error || authRes2.message}`, type: 'error' });
      } else {
        setToast({ open: true, message: 'Account deleted successfully', type: 'info' });
      }
      setReauthOpen(false);
    } catch (err) {
      console.error('Reauth flow failed:', err);
      setReauthError(err.message || String(err));
    } finally {
      setReauthLoading(false);
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

      {/* Notification Settings */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications about transactions and budgets</p>
            </div>
            <button
              onClick={() => handleSettingsChange('notifications', !settings.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive weekly summary emails</p>
            </div>
            <button
              onClick={() => handleSettingsChange('emailNotifications', !settings.emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

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

      <ReAuthDialog 
        open={reauthOpen} 
        onCancel={() => setReauthOpen(false)} 
        onConfirm={handleReauthConfirm} 
        loading={reauthLoading} 
        errorMessage={reauthError} 
      />
    </div>
  );
};

export default SettingsModal;