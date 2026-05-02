import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Globe,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Plus,
  Check,
  Smartphone,
  ShieldCheck,
  Database
} from 'lucide-react';
import Modal from '../UI/base/Modal';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import Select from '../UI/base/Select';
import GlassInput from '../UI/base/GlassInput';
import GlassBadge from '../UI/base/GlassBadge';
import IconBox from '../UI/base/IconBox';

import { useAuth } from '../../hooks/useAuth';
import {
  updateUserProfile,
  reauthenticateUser,
  reauthenticateWithGoogle,
  isGoogleUser
} from '../../services/authService';
import { exportUserData, deleteAllUserData, importUserData } from '../../services/transactionService';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../hooks/useTheme';
import { APP_EVENTS, PROFILE_EVENTS } from '../../config/constants';

const SettingsModal = ({ isOpen, onClose, resultClearMs = 10000 }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { refreshTransactions } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isUserGoogleAuth, setIsUserGoogleAuth] = useState(false);
  const [showEraseComplete, setShowEraseComplete] = useState(false);

  const { theme: currentTheme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    theme: userProfile?.theme || currentTheme || 'system',
    language: userProfile?.language || 'en',
    budgetAlerts: userProfile?.budgetAlerts !== false,
    notifications: userProfile?.notifications !== false
  });

  const [persistStatus, setPersistStatus] = useState('idle');
  const initialThemeRef = useRef(currentTheme);

  useEffect(() => {
    if (isOpen) {
      initialThemeRef.current = currentTheme;
      setPersistStatus('idle');
      setSettings(prev => ({ ...prev, theme: userProfile?.theme || currentTheme || 'system' }));
      setIsUserGoogleAuth(isGoogleUser());
    }
  }, [isOpen, currentTheme, userProfile?.theme]);

  const themes = [
    { value: 'light', label: 'Luminous', icon: Sun },
    { value: 'dark', label: 'Midnight', icon: Moon },
    { value: 'system', label: 'Adaptive', icon: Monitor }
  ];

  const languages = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    const previousTheme = initialThemeRef.current;
    try {
      setPersistStatus('saving');
      if (settings.theme) {
        setTheme(settings.theme);
      }

      const result = await updateUserProfile(user.uid, settings);
      if (result.success) {
        if (refreshUserProfile) await refreshUserProfile();
        setPersistStatus('success');
        setTimeout(() => setPersistStatus('idle'), 1500);
      } else {
        setTheme(previousTheme);
        setPersistStatus('error');
        setTimeout(() => setPersistStatus('idle'), 3000);
      }
    } catch {
      setTheme(previousTheme);
      setPersistStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await exportUserData(user.uid);
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wallet-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [importPayload, setImportPayload] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [preserveIds, setPreserveIds] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [importResult, setImportResult] = useState(null);

  const onFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
        alert('Invalid Vault Export file');
        return;
      }

      setImportPreview({
        profile: parsed.profile || {},
        totalTransactions: parsed.transactions.length,
        sample: parsed.transactions.slice(0, 3)
      });
      setImportPayload(parsed);
      setShowImportModal(true);
    } catch {
      alert('Failed to read Vault file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startImport = async () => {
    if (!importPayload) return;
    setImportLoading(true);
    try {
      const res = await importUserData(user.uid, importPayload, { preserveIds, dedupe });
      setImportResult(res);
      if (res.success) {
        if (refreshUserProfile) await refreshUserProfile();
        if (refreshTransactions) await refreshTransactions();
        window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { importResult: res } }));
      }
    } catch (error) {
      setImportResult({ success: false, error: error.message });
    } finally {
      setImportLoading(false);
      setShowImportModal(false);
      setImportPayload(null);
      setImportPreview(null);
      if (resultClearMs > 0) {
        setTimeout(() => setImportResult(null), resultClearMs);
      }
    }
  };

  const handleDeleteAccount = () => setShowDeleteConfirm(true);

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setShowReauthDialog(true);
  };

  const handleReauthAndDelete = async () => {
    const emailMatches = Boolean(emailConfirmation && user?.email && emailConfirmation.trim().toLowerCase() === user.email.trim().toLowerCase());
    if (emailConfirmation && !emailMatches) {
      alert('Email mismatch. Please verify your account identity.');
      return;
    }

    setDeleteLoading(true);
    try {
      if (!emailMatches) {
        let reauth;
        if (isUserGoogleAuth) {
          reauth = await reauthenticateWithGoogle();
        } else {
          reauth = await reauthenticateUser(password);
        }
        if (!reauth.success) return alert('Verification failed.');
      }

      const deleteData = await deleteAllUserData(user.uid);
      if (!deleteData.success) return alert('Erase operation aborted.');

      await updateUserProfile(user.uid, {
        balance: 0, totalIncome: 0, totalExpense: 0, totalCreditGiven: 0, totalLoanTaken: 0, transactionsCount: 0
      });

      window.dispatchEvent(new CustomEvent(PROFILE_EVENTS.PROFILE_UPDATED, { detail: { uid: user.uid, profile: {} } }));
      window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { erased: true } }));

      setShowEraseComplete(true);
    } catch {
      alert('Erase operation failed.');
    } finally {
      setDeleteLoading(false);
      setShowReauthDialog(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="System Configuration"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" color="gray" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button color="teal" fullWidth onClick={handleSaveSettings} loading={loading} icon={Check}>
              Apply Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Theme & Visuals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Interface Theme</span>
              </div>
              {persistStatus !== 'idle' && (
                <GlassBadge
                  label={persistStatus === 'saving' ? 'Saving...' : persistStatus === 'success' ? 'Saved' : 'Error'}
                  variant={persistStatus === 'success' ? 'teal' : persistStatus === 'error' ? 'red' : 'gray'}
                />
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = settings.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSettings(prev => ({ ...prev, theme: t.value }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${isActive
                      ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/5'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-gray-500'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regional Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-1">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Language</span>
              </label>
              <Select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                options={languages.map(l => ({ value: l.value, label: `${l.flag} ${l.label}` }))}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-1">
                <Smartphone className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Device Sync</span>
              </label>
              <div className="h-10 bg-white/5 border border-white/5 rounded-2xl flex items-center px-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">v1.2.0</span>
              </div>
            </div>
          </div>

          {/* Intelligence Settings */}
          <GlassCard padding="p-5" className="bg-white/[0.02] border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Security & Intelligence</span>
            </div>
            <div className="space-y-4">
              {[
                { key: 'budgetAlerts', label: 'Predictive Budget Alerts', desc: 'Notify when approaching spending ceilings' },
                { key: 'notifications', label: 'Financial Insights', desc: 'Weekly analytics and anomaly detection' }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings[item.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500/50 peer-checked:after:bg-teal-400"></div>
                  </div>
                </label>
              ))}
            </div>
          </GlassCard>

          {/* Data Governance */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Sovereignty</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-teal-500/30 transition-all group"
              >
                <div className="text-left">
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">Vault Export</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">JSON Snapshot</p>
                </div>
                <Download className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
              >
                <div className="text-left">
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">Restore Data</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Import Vault</p>
                </div>
                <Plus className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileSelect} className="hidden" />

            {/* Import Status Feedback */}
            {importResult && (
              <div className={`p-4 rounded-2xl border ${importResult.success ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-red-500/5 border-red-500/10 text-red-500'} animate-in fade-in zoom-in-95 duration-300`}>
                <div className="flex items-center gap-3">
                  {importResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest">
                      {importResult.success ? 'Vault Restored' : 'Import Aborted'}
                    </p>
                    <p className="text-[10px] opacity-70 font-bold mt-0.5 uppercase tracking-wider">
                      {importResult.success 
                        ? `Integrated ${importResult.imported} of ${importResult.total} ledger entries.`
                        : importResult.error || 'System validation failed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group mt-2"
            >
              <div className="text-left">
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">Purge Vault</p>
                <p className="text-[9px] text-red-500/50 font-bold uppercase mt-0.5">Permanent Erasure</p>
              </div>
              <Trash2 className="w-4 h-4 text-red-500/40 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Modern Import Dialog */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Wallet Data"
          size="sm"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="ghost" color="gray" fullWidth onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button color="teal" fullWidth onClick={startImport} loading={importLoading} icon={Check}>Start Import</Button>
            </div>
          }
        >
          <div className="space-y-5">
            <GlassCard className="bg-emerald-500/5 border-emerald-500/10" padding="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{importPreview?.totalTransactions} Records Found</p>
                  <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Verified Vault Snapshot</p>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Overwrite Conflict</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Preserve original system identifiers</p>
                </div>
                <input type="checkbox" checked={preserveIds} onChange={(e) => setPreserveIds(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-teal-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Duplicate Shield</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Skip already existing ledger entries</p>
                </div>
                <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-teal-500" />
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Modern Purge Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Purge Vault Data"
        message="This will permanently incinerate all financial records and configurations. Your identity account will remain active. This action is irreversible."
        confirmText="Confirm Purge"
        type="danger"
      />

      <Modal
        isOpen={showReauthDialog}
        onClose={() => setShowReauthDialog(false)}
        title="Identity Verification"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" color="gray" fullWidth onClick={() => setShowReauthDialog(false)}>Cancel</Button>
            <Button color="red" fullWidth onClick={handleReauthAndDelete} loading={deleteLoading} icon={Trash2}>Verify & Purge</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <GlassCard className="bg-red-500/5 border-red-500/10" padding="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">High-Risk Operation</p>
                <p className="text-[10px] text-red-500/70 font-medium mt-1 leading-relaxed">
                  To proceed with the total erasure of your vault, please provide your account password or verify your email.
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Confirmation Key</label>
            {isUserGoogleAuth ? (
              <GlassInput
                type="email"
                value={emailConfirmation}
                onChange={(e) => setEmailConfirmation(e.target.value)}
                placeholder="Account Email"
                required
              />
            ) : (
              <GlassInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account Password"
                required
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEraseComplete}
        onClose={() => { setShowEraseComplete(false); onClose?.(); }}
        title="Operation Complete"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white">Vault Purged Successfully</p>
            <p className="text-xs text-gray-500 font-medium px-4">All local and cloud financial records have been permanently erased.</p>
          </div>
          <Button color="teal" className="mt-4 min-w-[120px]" onClick={() => { setShowEraseComplete(false); onClose?.(); }}>Return to System</Button>
        </div>
      </Modal>
    </>
  );
};

export default SettingsModal;