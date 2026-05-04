import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Check } from 'lucide-react';
import Modal from '../UI/base/Modal';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import Button from '../UI/base/Button';
import IconBox from '../UI/base/IconBox';
import GlassCard from '../UI/base/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';

const ProfileModal = ({ isOpen, onClose, onSave }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const detectDefaultName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    try {
      const pd = user?.providerData;
      if (pd && pd.length > 0 && pd[0].displayName) return pd[0].displayName;
    } catch (err) { void err; }
    if (user?.email) return String(user.email).split('@')[0];
    return '';
  };

  const [formData, setFormData] = useState({
    displayName: detectDefaultName(),
    currency: userProfile?.currency || 'BDT'
  });

  useEffect(() => {
    setFormData({
      displayName: detectDefaultName(),
      currency: userProfile?.currency || 'BDT'
    });
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
      const result = await updateUserProfile(user.uid, formData);

      if (result.success) {
        await refreshUserProfile();
        if (formData.currency !== userProfile?.currency) {
          window.dispatchEvent(new CustomEvent('wallet:currency-changed', {
            detail: { newCurrency: formData.currency, oldCurrency: userProfile?.currency }
          }));
        }
        onSave?.();
        onClose();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formId = 'profile-settings-form';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Identity Management"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="soft"
            color="ink"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            color="primary"
            fullWidth
            loading={loading}
            icon={Check}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {/* User Identity Header */}
        <div className="p-4 rounded-3xl bg-paper-100/50 dark:bg-ink-950/20 border border-paper-200 dark:border-paper-900/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-xl shadow-primary-500/10 overflow-hidden border-2 border-white dark:border-ink-950">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={formData.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="drop-shadow-md">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary-500 border-2 border-white dark:border-ink-950 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2.5">
                <IconBox icon={Mail} size="xs" variant="glass" color="ink" className="opacity-40" />
                <span className="text-label truncate text-ink-400 dark:text-paper-600">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <IconBox icon={Calendar} size="xs" variant="glass" color="ink" className="opacity-40" />
                <span className="text-label text-ink-300 dark:text-paper-700">
                  Active since {new Date(user?.metadata?.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-overline opacity-40 px-1 flex items-center gap-2">
              <User className="w-3 h-3" />
              Display Name
            </label>
            <GlassInput
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Your Name"
              required
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-1.5">
            <label className="text-overline opacity-40 px-1 flex items-center gap-2">
              <span className="w-3 h-3 flex items-center justify-center font-bold">৳</span>
              Master Currency
            </label>
            <Select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              options={currencies.map(c => ({
                value: c.value,
                label: `${c.flag} ${c.label}`
              }))}
            />
          </div>
        </div>

        <GlassCard variant="flat" padding="p-4" className="bg-primary-500/[0.03] dark:bg-primary-500/[0.01] border-primary-500/10">
          <p className="text-overline text-primary-600/60 dark:text-primary-400/40 text-center opacity-80 uppercase">
            Currency modifications propagate through all analytics and historical logs.
          </p>
        </GlassCard>
      </form>
    </Modal>
  );
};

export default ProfileModal;