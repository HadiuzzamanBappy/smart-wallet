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
    theme: currentTheme || 'system',
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
      setSettings(prev => ({ ...prev, theme: currentTheme || 'system' }));
      setIsUserGoogleAuth(isGoogleUser());
    }
  }, [isOpen, currentTheme]);

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
      
      // Update theme locally only
      if (settings.theme) {
        setTheme(settings.theme);
      }

      // Remove theme from settings before saving to DB
      const { theme: _theme, ...dbSettings } = settings;
      const result = await updateUserProfile(user.uid, dbSettings);
      
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
          <div className="flex gap-4 w-full">
            <Button variant="ghost" color="gray" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button color="teal" fullWidth onClick={handleSaveSettings} loading={loading} icon={Check}>
              Apply Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Theme & Visuals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Appearance Suite</span>
              </div>
              {persistStatus !== 'idle' && (
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${persistStatus === 'success' 
                  ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' 
                  : persistStatus === 'error' ? 'bg-rose-500/5 text-rose-600 border-rose-500/10' : 'bg-gray-500/5 text-gray-600 border-gray-500/10'}`}>
                  {persistStatus === 'saving' ? 'Syncing...' : persistStatus === 'success' ? 'Vault Updated' : 'Sync Error'}
                </div>
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
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-500 ${isActive
                      ? 'bg-teal-500/5 border-teal-500/30 shadow-lg shadow-teal-500/5'
                      : 'bg-gray-50/50 dark:bg-white/[0.01] border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-600'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regional Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 px-1">
                <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Localization</span>
              </label>
              <Select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                options={languages.map(l => ({ value: l.value, label: `${l.flag} ${l.label}` }))}
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 px-1">
                <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Build Status</span>
              </label>
              <div className="h-11 bg-gray-50/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 rounded-2xl flex items-center px-4">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">v1.2.0 AUDITED</span>
              </div>
            </div>
          </div>

          {/* Intelligence Settings */}
          <div className="p-6 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Privacy & Intelligence</span>
            </div>
            <div className="space-y-6">
              {[
                { key: 'budgetAlerts', label: 'Predictive Ceilings', desc: 'Notify when approaching spending thresholds' },
                { key: 'notifications', label: 'Executive Insights', desc: 'Weekly analytics and anomaly reporting' }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1 pr-4">
                    <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest group-hover:text-teal-600 transition-colors">{item.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 opacity-60 leading-none">{item.desc}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings[item.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 shadow-sm border border-transparent dark:border-white/5"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Data Governance */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 px-1">
              <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sovereignty Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportData}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.03] hover:border-teal-500/30 transition-all group shadow-sm"
              >
                <div className="text-left">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Vault Export</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 opacity-60">JSON Snapshot</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <Download className="w-4 h-4" />
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all group shadow-sm"
              >
                <div className="text-left">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Import Vault</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 opacity-60">Restore Data</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileSelect} className="hidden" />

            {/* Import Status Feedback */}
            {importResult && (
              <div className={`p-5 rounded-2xl border ${importResult.success ? 'bg-emerald-500/[0.03] border-emerald-500/10 text-emerald-700 dark:text-emerald-500' : 'bg-rose-500/[0.03] border-rose-500/10 text-rose-700 dark:text-rose-500'} animate-in slide-in-from-top-2 duration-500`}>
                <div className="flex items-center gap-4">
                  {importResult.success ? <CheckCircle className="w-5 h-5 opacity-60" /> : <AlertCircle className="w-5 h-5 opacity-60" />}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {importResult.success ? 'Vault Integrated' : 'Integration Failed'}
                    </p>
                    <p className="text-[9px] font-black mt-1 uppercase tracking-[0.1em] leading-relaxed opacity-60">
                      {importResult.success 
                        ? `Audit complete: ${importResult.imported} of ${importResult.total} entries synchronized.`
                        : importResult.error || 'Identity verification mismatch.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-rose-500/[0.03] dark:bg-rose-500/[0.01] border border-rose-500/10 hover:bg-rose-500/10 transition-all group mt-2 shadow-sm"
            >
              <div className="text-left">
                <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Purge Protocol</p>
                <p className="text-[9px] text-rose-500/40 dark:text-rose-500/20 font-black uppercase tracking-widest mt-1.5 leading-none">Total Vault Erasure</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/5 flex items-center justify-center text-rose-400 group-hover:text-rose-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modern Import Dialog */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Vault Integration"
          size="sm"
          footer={
            <div className="flex gap-4 w-full">
              <Button variant="ghost" color="gray" fullWidth onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button color="teal" fullWidth onClick={startImport} loading={importLoading} icon={Check}>Execute Import</Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-sm">
                  <Database className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{importPreview?.totalTransactions} Audit Entries</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500/50 font-black uppercase tracking-[0.2em] mt-1.5">Integrity Verified</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1 pr-4">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest group-hover:text-teal-600 transition-colors">Legacy Persistence</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 opacity-60 leading-none">Preserve original identifiers</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={preserveIds} onChange={(e) => setPreserveIds(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1 pr-4">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest group-hover:text-teal-600 transition-colors">Anomaly Filter</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest mt-1.5 opacity-60 leading-none">Skip duplicate ledger entries</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
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
        title="Protocol: Erasure"
        message="This operation will incinerate all financial audit logs and system configurations. Identity accounts persist, but vault contents are purged permanently."
        confirmText="Confirm Purge"
        type="danger"
      />

      <Modal
        isOpen={showReauthDialog}
        onClose={() => setShowReauthDialog(false)}
        title="Identity Verification"
        size="sm"
        footer={
          <div className="flex gap-4 w-full">
            <Button variant="ghost" color="gray" fullWidth onClick={() => setShowReauthDialog(false)}>Cancel</Button>
            <Button color="red" fullWidth onClick={handleReauthAndDelete} loading={deleteLoading} icon={Trash2}>Execute Purge</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-rose-500/[0.03] dark:bg-rose-500/[0.01] border border-rose-500/10">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mb-2">High-Risk Operation</p>
                <p className="text-[10px] text-rose-700/60 dark:text-rose-500/40 font-black uppercase tracking-widest leading-relaxed">
                  Verification required to initiate total vault erasure protocol.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1">Confirmation Key</label>
            {isUserGoogleAuth ? (
              <GlassInput
                type="email"
                value={emailConfirmation}
                onChange={(e) => setEmailConfirmation(e.target.value)}
                placeholder="Account Identity Email"
                required
              />
            ) : (
              <GlassInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vault Access Password"
                required
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEraseComplete}
        onClose={() => { setShowEraseComplete(false); onClose?.(); }}
        title="Operation: Success"
        size="sm"
      >
        <div className="flex flex-col items-center gap-6 py-10 px-4">
          <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/5 dark:bg-emerald-500/[0.01] border border-emerald-500/10 flex items-center justify-center shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-500 opacity-60" />
          </div>
          <div className="text-center space-y-3">
            <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Vault Purged</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest px-8 leading-relaxed opacity-60">
              Operational logs and ledger entries have been permanently decommissioned.
            </p>
          </div>
          <Button color="teal" className="mt-4 min-w-[180px]" onClick={() => { setShowEraseComplete(false); onClose?.(); }}>Return to Hub</Button>
        </div>
      </Modal>
    </>
  );
};

export default SettingsModal;