import { useState, useEffect, useRef } from 'react';
import {
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
import { THEME } from '../../config/theme';
import Modal from '../UI/base/Modal';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import Button from '../UI/base/Button';
import Select from '../UI/base/Select';
import GlassInput from '../UI/base/GlassInput';
import SectionHeader from '../UI/base/SectionHeader';
import GlassCard from '../UI/base/GlassCard';
import IconBox from '../UI/base/IconBox';
import Badge from '../UI/base/Badge';

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
          <div className="flex gap-3 w-full">
            <Button variant="soft" color="ink" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button color="primary" fullWidth onClick={handleSaveSettings} loading={loading} icon={Check}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Theme & Visuals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                icon={Sun}
                title="Appearance Suite"
                titleSize="text-h6"
                className="mb-0"
              />
              {persistStatus !== 'idle' && (
                <Badge
                  color={persistStatus === 'success' ? 'success' : persistStatus === 'error' ? 'error' : 'ink'}
                  variant="glass"
                  size="sm"
                >
                  {persistStatus === 'saving' ? 'Syncing...' : persistStatus === 'success' ? 'Vault Updated' : 'Sync Error'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = settings.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSettings(prev => ({ ...prev, theme: t.value }))}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 ${isActive
                      ? 'bg-primary-500/5 border-primary-500/30 shadow-lg shadow-primary-500/5'
                      : 'bg-paper-100/50 dark:bg-ink-950/20 border-paper-200 dark:border-paper-900/10 hover:bg-paper-200 dark:hover:bg-ink-900/40'
                      }`}
                  >
                    <IconBox
                      icon={Icon}
                      size="sm"
                      variant={isActive ? 'primary' : 'glass'}
                      color={isActive ? 'primary' : 'ink'}
                    />
                    <span className={`text-label font-bold tracking-wide ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-ink-400 dark:text-paper-600'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Regional & Intelligence */}
          <div className="space-y-4">
            <GlassCard padding="p-3" variant="flat" className="bg-paper-100/50 dark:bg-ink-950/20">
              <SectionHeader icon={Globe} title="Localization" titleSize="text-overline" className="mb-3" />
              <Select
                size="sm"
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                options={languages.map(l => ({ value: l.value, label: `${l.flag} ${l.label}` }))}
              />
            </GlassCard>

            <GlassCard padding="p-3" variant="flat" className="bg-paper-100/50 dark:bg-ink-950/20">
              <SectionHeader icon={ShieldCheck} title="Intelligence" titleSize="text-overline" className="mb-3" />
              <div className="space-y-3">
                {[
                  { key: 'budgetAlerts', label: 'Predictive Ceilings' },
                  { key: 'notifications', label: 'Executive Insights' }
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-tight group-hover:text-primary-500 transition-colors">{item.label}</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings[item.key]}
                        onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <div className="w-9 h-5 bg-paper-300 dark:bg-ink-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </div>
                  </label>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Data Governance */}
          <section>
            <SectionHeader icon={Database} title="Data Sovereignty" titleSize="text-h6" className="mb-4" />
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-paper-100/50 dark:bg-ink-950/20 border border-paper-200 dark:border-paper-900/10 hover:border-primary-500/30 transition-all group shadow-sm"
              >
                <div className="text-left">
                  <p className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-wide">Vault Export</p>
                  <p className="text-overline text-ink-400 dark:text-paper-700 font-medium tracking-wide mt-1 opacity-60">JSON Snapshot</p>
                </div>
                <IconBox icon={Download} size="sm" variant="glass" color="ink" className="group-hover:text-primary-500" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-paper-100/50 dark:bg-ink-950/20 border border-paper-200 dark:border-paper-900/10 hover:border-success-500/30 transition-all group shadow-sm"
              >
                <div className="text-left">
                  <p className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-wide">Import Vault</p>
                  <p className="text-overline text-ink-400 dark:text-paper-700 font-medium tracking-wide mt-1 opacity-60">Restore Data</p>
                </div>
                <IconBox icon={Plus} size="sm" variant="glass" color="ink" className="group-hover:text-success-500" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileSelect} className="hidden" />

            {/* Import Status Feedback */}
            {importResult && (
              <GlassCard 
                variant="flat" 
                padding="p-4" 
                className={`mt-3 ${importResult.success ? 'bg-success-500/[0.03] border-success-500/10' : 'bg-error-500/[0.03] border-error-500/10'} animate-in slide-in-from-top-2 duration-500`}
              >
                <div className="flex items-center gap-3">
                  <IconBox icon={importResult.success ? CheckCircle : AlertCircle} size="sm" variant="glass" color={importResult.success ? 'success' : 'error'} />
                  <div className="flex-1">
                    <p className={`text-overline font-bold tracking-wide ${importResult.success ? 'text-success-600' : 'text-error-600'}`}>
                      {importResult.success ? 'Vault Integrated' : 'Integration Failed'}
                    </p>
                    <p className="text-overline font-medium mt-1 opacity-60 leading-relaxed font-light">
                      {importResult.success
                        ? `Audit complete: ${importResult.imported} of ${importResult.total} entries synchronized.`
                        : importResult.error || 'Identity verification mismatch.'}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-error-500/[0.03] dark:bg-error-500/[0.01] border border-error-500/10 hover:bg-error-500/10 transition-all group mt-3 shadow-sm"
            >
              <div className="text-left">
                <p className="text-label font-bold text-error-600 dark:text-error-400 tracking-wide">Purge Protocol</p>
                <p className="text-overline text-error-500/40 font-bold tracking-wide mt-1">Total Vault Erasure</p>
              </div>
              <IconBox icon={Trash2} size="sm" variant="glass" color="error" className="group-hover:scale-110 transition-transform" />
            </button>
          </section>
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
            <div className="flex gap-3 w-full">
              <Button variant="soft" color="ink" fullWidth onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button color="primary" fullWidth onClick={startImport} loading={importLoading} icon={Check}>Execute Import</Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-success-500/[0.03] dark:bg-success-500/[0.01] border border-success-500/10">
              <div className="flex items-center gap-4">
                <IconBox icon={Database} size="lg" variant="glass" color="success" />
                <div>
                  <p className="text-body font-bold text-ink-900 dark:text-paper-50 tracking-tight">{importPreview?.totalTransactions} Audit Entries</p>
                  <p className="text-overline text-success-600 dark:text-success-500 mt-1">Integrity Verified</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'preserveIds', label: 'Legacy Persistence', desc: 'Preserve original identifiers', state: preserveIds, setState: setPreserveIds },
                { key: 'dedupe', label: 'Anomaly Filter', desc: 'Skip duplicate ledger entries', state: dedupe, setState: setDedupe }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1 pr-4">
                    <p className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-wide group-hover:text-primary-500 transition-colors">{item.label}</p>
                    <p className="text-overline text-ink-400 dark:text-paper-600 font-medium mt-1 leading-none font-light">{item.desc}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={item.state} onChange={(e) => item.setState(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-paper-300 dark:bg-ink-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                  </div>
                </label>
              ))}
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
          <div className="flex gap-3 w-full">
            <Button variant="soft" color="ink" fullWidth onClick={() => setShowReauthDialog(false)}>Cancel</Button>
            <Button color="error" fullWidth onClick={handleReauthAndDelete} loading={deleteLoading} icon={Trash2}>Execute Purge</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <GlassCard variant="flat" padding="p-4" className="bg-error-500/[0.03] dark:bg-error-500/[0.01] border-error-500/10">
            <div className="flex items-start gap-4">
              <IconBox icon={AlertCircle} size="sm" variant="glass" color="error" className="shrink-0 mt-0.5" />
              <div>
                <p className="text-overline text-error-600 dark:text-error-400 mb-2">High-Risk Operation</p>
                <p className="text-label text-error-700/60 dark:text-error-500/40 font-medium leading-relaxed font-light">
                  Verification required to initiate total vault erasure protocol.
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-2">
            <label className="text-overline opacity-40 px-1">Confirmation Key</label>
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
          <IconBox icon={CheckCircle} size="xl" variant="glass" color="success" className="w-20 h-20 rounded-[2.5rem]" />
          <div className="text-center space-y-2">
            <p className="text-h4 font-bold text-ink-900 dark:text-paper-50 tracking-tight">Vault Purged</p>
            <p className="text-label text-ink-500 dark:text-paper-500 px-8 leading-relaxed font-light">
              Operational logs and ledger entries have been permanently decommissioned.
            </p>
          </div>
          <Button color="primary" className="mt-4 min-w-[180px]" onClick={() => { setShowEraseComplete(false); onClose?.(); }}>Return to Hub</Button>
        </div>
      </Modal>
    </>
  );
};

export default SettingsModal;