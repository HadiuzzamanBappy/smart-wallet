import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar } from 'lucide-react';
import Modal from '../UI/Modal';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';

const ProfileModal = ({ isOpen, onClose, onSave }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const detectDefaultName = () => {
    // Prefer explicit profile value, then firebase user displayName, then providerData displayName, then email local-part
    if (userProfile && userProfile.displayName) return userProfile.displayName;
    if (user && user.displayName) return user.displayName;
    try {
      const pd = user?.providerData;
      if (pd && pd.length > 0 && pd[0].displayName) return pd[0].displayName;
    } catch (err) { void err; }
    if (user && user.email) return String(user.email).split('@')[0];
    return '';
  };

  const [formData, setFormData] = useState({
    displayName: detectDefaultName(),
    currency: userProfile?.currency || 'BDT',
    monthlyBudget: userProfile?.monthlyBudget || '',
    budgetAlerts: userProfile?.budgetAlerts !== false
  });

  // Keep form in sync when modal opens or when the auth/profile updates
  useEffect(() => {
    setFormData({
      displayName: detectDefaultName(),
      currency: userProfile?.currency || 'BDT',
      monthlyBudget: userProfile?.monthlyBudget || '',
      budgetAlerts: userProfile?.budgetAlerts !== false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const currencies = [
    { value: 'BDT', label: 'BDT (৳)', flag: '🇧🇩' },
    { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
    { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
    { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
    { value: 'INR', label: 'INR (₹)', flag: '🇮🇳' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        monthlyBudget: formData.monthlyBudget ? Number(formData.monthlyBudget) : 0
      };

      const result = await updateUserProfile(user.uid, updateData);
      
      if (result.success) {
        // Refresh user profile to get updated data
        await refreshUserProfile();
        
        // Dispatch custom event to notify other components about currency change
        if (formData.currency !== userProfile?.currency) {
          const event = new CustomEvent('wallet:currency-changed', { 
            detail: { newCurrency: formData.currency, oldCurrency: userProfile?.currency } 
          });
          window.dispatchEvent(event);
        }
        
        onSave?.();
        onClose();
      } else {
        console.error('Profile update failed:', result.error);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white text-lg font-semibold">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mt-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Member since {new Date(user?.metadata?.creationTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Display Name
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Your name"
            required
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="input-field"
          >
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.flag} {currency.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monthly Budget (Optional)
          </label>
          <input
            type="number"
            name="monthlyBudget"
            value={formData.monthlyBudget}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter your monthly budget"
            min="0"
            step="0.01"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set a monthly spending limit to get budget alerts
          </p>
        </div>

        {/* Budget Alerts */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="budgetAlerts"
            name="budgetAlerts"
            checked={formData.budgetAlerts}
            onChange={handleInputChange}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <label htmlFor="budgetAlerts" className="text-sm text-gray-700 dark:text-gray-300">
            Enable budget alerts
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;