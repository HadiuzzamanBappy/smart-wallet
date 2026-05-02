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
      title="Profile Identity"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
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
            Save Changes
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {/* User Identity Header */}
        <GlassCard padding="p-4" className="bg-white/5 border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-teal-500/20 overflow-hidden">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={formData.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 border-4 border-[#0f172a] rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Mail className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Active since {new Date(user?.metadata?.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-1">
            <User className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Legal Name</span>
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
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-1">
            <span className="text-teal-500 font-bold text-sm">৳</span>
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Base Currency</span>
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

        <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10">
          <p className="text-[10px] text-teal-500/70 font-bold uppercase tracking-widest leading-relaxed">
            Your currency preference affects all analytics, historical logs, and automated insights across the platform.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;