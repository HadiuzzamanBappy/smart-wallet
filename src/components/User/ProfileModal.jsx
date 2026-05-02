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
      title="Identity Profile"
      size="md"
      footer={
        <div className="flex gap-4 w-full">
          <Button
            variant="ghost"
            color="gray"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Discard
          </Button>
          <Button
            type="submit"
            form={formId}
            color="teal"
            fullWidth
            loading={loading}
            icon={Check}
          >
            Update Audit
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {/* User Identity Header */}
        <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-teal-500/10 overflow-hidden border-2 border-white dark:border-gray-900">
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
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 border-4 border-white dark:border-gray-900 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 mb-2">
                <Mail className="w-3.5 h-3.5 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em] truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400 dark:text-gray-600">
                <Calendar className="w-3.5 h-3.5 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                  Audit Initiated {new Date(user?.metadata?.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Display Name */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 px-1">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Audit Persona</span>
            </label>
            <GlassInput
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Executive Name"
              required
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 px-1">
              <span className="text-teal-600 dark:text-teal-400 font-black text-sm">৳</span>
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Master Currency</span>
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

        <div className="p-4 rounded-2xl bg-teal-500/[0.03] dark:bg-teal-500/[0.01] border border-teal-500/10">
          <p className="text-[10px] text-teal-600/60 dark:text-teal-400/40 font-black uppercase tracking-widest leading-relaxed text-center">
            Currency modifications propagate through all visual analytics and historical audit logs.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;