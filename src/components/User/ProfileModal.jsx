import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Calendar, Check } from 'lucide-react';
import Modal from '../UI/base/Modal';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import Button from '../UI/base/Button';
import Badge from '../UI/base/Badge';
import GlassCard from '../UI/base/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';

const ProfileModal = ({ isOpen, onClose, onSave }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const detectDefaultName = useCallback(() => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    try {
      const pd = user?.providerData;
      if (pd && pd.length > 0 && pd[0].displayName) return pd[0].displayName;
    } catch (err) { void err; }
    if (user?.email) return String(user.email).split('@')[0];
    return '';
  }, [user, userProfile]);

  const [formData, setFormData] = useState({
    displayName: detectDefaultName(),
    currency: userProfile?.currency || 'BDT'
  });

  useEffect(() => {
    setFormData({
      displayName: detectDefaultName(),
      currency: userProfile?.currency || 'BDT'
    });
  }, [user, userProfile, detectDefaultName]);

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
      size="sm"
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
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* Compact User Identity */}
        <div className="p-3 rounded-2xl bg-paper-100/50 dark:bg-ink-950/20 border border-paper-200/60 dark:border-paper-900/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-primary-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-primary-500/20 overflow-hidden border border-white/50 dark:border-ink-950">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={formData.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-bold">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border border-white dark:border-ink-950 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label font-bold text-ink-900 dark:text-paper-50 truncate leading-tight">
                {formData.displayName || 'Identity Node'}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1 opacity-50">
                  <Mail className="w-2.5 h-2.5" />
                  <span className="text-label truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <Calendar className="w-2.5 h-2.5" />
                  <span className="text-label">
                    {new Date(user?.metadata?.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-label font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
              <User className="w-3 h-3" />
              Display Name
            </label>
            <GlassInput
              name="displayName"
              size="sm"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Your Name"
              required
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-1">
            <label className="text-label font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
              <Badge size="sm" color="ink" variant="soft" className="!p-0 !bg-transparent">৳</Badge>
              Master Currency
            </label>
            <Select
              name="currency"
              size="sm"
              value={formData.currency}
              onChange={handleInputChange}
              options={currencies.map(c => ({
                value: c.value,
                label: `${c.flag} ${c.label}`
              }))}
            />
          </div>
        </div>

        <GlassCard variant="flat" padding="p-2.5" className="bg-primary-500/[0.03] dark:bg-primary-500/[0.01] border-primary-500/10">
          <p className="text-overline text-primary-600/60 dark:text-primary-400/40 text-center uppercase tracking-tighter">
            Modifications propagate through all historical audit logs.
          </p>
        </GlassCard>
      </form>
    </Modal>
  );
};

export default ProfileModal;