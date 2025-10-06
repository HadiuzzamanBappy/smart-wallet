import React, { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  Download, 
  Trash2,
  AlertCircle 
} from 'lucide-react';
import Modal from '../UI/Modal';
import ConfirmDialog from '../UI/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { 
  updateUserProfile, 
  deleteAuthUser, 
  reauthenticateUser, 
  reauthenticateWithGoogle,
  isGoogleUser,
  confirmEmailForDeletion 
} from '../../services/authService';
import { exportUserData, deleteAllUserData, importUserData } from '../../services/transactionService';
import { useTransactions } from '../../hooks/useTransactions';

const SettingsModal = ({ isOpen, onClose, resultClearMs = 10000 }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { refreshTransactions } = useTransactions();
  // Theme will be handled through settings state
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isUserGoogleAuth, setIsUserGoogleAuth] = useState(false);
  
  const [settings, setSettings] = useState({
    theme: userProfile?.theme || 'system',
    language: userProfile?.language || 'en',
    budgetAlerts: userProfile?.budgetAlerts !== false,
    notifications: userProfile?.notifications !== false
  });

  // Check authentication method when modal opens
  React.useEffect(() => {
    if (isOpen && user) {
      setIsUserGoogleAuth(isGoogleUser());
    }
  }, [isOpen, user]);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const languages = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const result = await updateUserProfile(user.uid, settings);
      if (result.success) {
        await refreshUserProfile();
        // Apply theme immediately if changed
        if (settings.theme !== userProfile?.theme) {
          if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (settings.theme === 'light') {
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
        }
      }
    } catch (error) {
      console.error('Settings update failed:', error);
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
        link.download = `wallet-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Import data from JSON file exported earlier
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  const [importPayload, setImportPayload] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { profile, transactions }
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

      // Basic validation
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
        console.error('Invalid import file');
        alert('Invalid import file format');
        return;
      }

      // Build a small preview (counts + sample)
      const preview = {
        profile: parsed.profile || {},
        totalTransactions: parsed.transactions.length,
        sample: parsed.transactions.slice(0, 5)
      };

      setImportPreview(preview);
      setImportPayload(parsed);
      setShowImportModal(true);
    } catch (error) {
      console.error('Error reading import file:', error);
      alert('Failed to read import file');
    } finally {
      // Reset input so same file can be reselected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  // Import immediately using the parsed payload stored in state when the file was selected
  const startImport = async () => {
    if (!importPayload) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await importUserData(user.uid, importPayload, { preserveIds, dedupe });
      setImportResult(res);
      if (res.success) {
        // Refresh profile and transactions so the UI updates immediately
        if (refreshUserProfile) await refreshUserProfile();
        try {
          if (refreshTransactions) await refreshTransactions();
        } catch (err) {
          console.warn('Failed to refresh transactions after import:', err?.message || err);
        }

        // Dispatch a global event so components listening for transaction updates refresh their views
        try {
          window.dispatchEvent(new CustomEvent('wallet:transactions-updated', { detail: { importResult: res } }));
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({ success: false, error: error.message });
    } finally {
      setImportLoading(false);
      setShowImportModal(false);
      setImportPayload(null);
      setImportPreview(null);
      // Auto-clear the import result after a short delay to avoid clutter
      if (resultClearMs > 0) {
        setTimeout(() => {
          setImportResult(null);
        }, resultClearMs);
      }
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setShowReauthDialog(true);
    // Reset form fields
    setPassword('');
    setEmailConfirmation('');
  };

  const handleReauthAndDelete = async () => {
    // Validate input based on auth method
    if (isUserGoogleAuth && !emailConfirmation) return;
    if (!isUserGoogleAuth && !password) return;
    
    setDeleteLoading(true);
    try {
      let reauth;
      
      if (isUserGoogleAuth) {
        // For Google users: confirm email first, then reauthenticate with Google
        const emailCheck = await confirmEmailForDeletion(emailConfirmation);
        if (!emailCheck.success) {
          console.error('Email confirmation failed:', emailCheck.error);
          return;
        }
        
        // Reauthenticate with Google popup
        reauth = await reauthenticateWithGoogle();
      } else {
        // For email/password users: reauthenticate with password
        reauth = await reauthenticateUser(password);
      }
      
      if (!reauth.success) {
        console.error('Reauthentication failed:', reauth.error);
        return;
      }

      // Delete Firestore data
      const deleteData = await deleteAllUserData(user.uid);
      if (!deleteData.success) {
        console.error('Data deletion failed:', deleteData.error);
        return;
      }

      // Delete auth user
      const deleteAuth = await deleteAuthUser();
      if (!deleteAuth.success) {
        console.error('Auth deletion failed:', deleteAuth.error);
        return;
      }

      // Clear all local storage and cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cached data from IndexedDB if used
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Success - user will be signed out automatically
    } catch (error) {
      console.error('Account deletion failed:', error);
    } finally {
      setDeleteLoading(false);
      setShowReauthDialog(false);
      setPassword('');
      setEmailConfirmation('');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Appearance
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => setSettings(prev => ({ ...prev, theme: theme.value }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.theme === theme.value
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                    <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {theme.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Language
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((language) => (
                <button
                  key={language.value}
                  onClick={() => setSettings(prev => ({ ...prev, language: language.value }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.language === language.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-lg mb-1">{language.flag}</div>
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    {language.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Notifications
            </h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.budgetAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, budgetAlerts: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Budget alerts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">General notifications</span>
              </label>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Data Management
            </h4>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Download className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Export Data</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Download all your data as JSON</div>
                </div>
              </button>
              
                <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={onFileSelect}
                  className="hidden"
                />

                <button
                  onClick={triggerImport}
                  className="w-full mt-2 flex items-center space-x-3 p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Download className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Import Data</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Select a previously exported JSON to restore data</div>
                  </div>
                  {importLoading && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              </div>
              
              {/* Import Modal */}
              {showImportModal && (
                <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Data" size="md">
                  <div className="space-y-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Preview: {importPreview?.totalTransactions || 0} transactions. Sample (up to 5):
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded space-y-2 max-h-40 overflow-auto">
                      {importPreview?.sample?.map((s, i) => (
                        <div key={i} className="text-xs">
                          <strong>{s.type}</strong> • {s.amount} • {s.description || s.category}
                        </div>
                      ))}
                    </div>

                        <div className="flex flex-col gap-3">
                          {/* Preserve IDs toggle */}
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={preserveIds}
                                onChange={(e) => setPreserveIds(e.target.checked)}
                                className="sr-only"
                                aria-label="Preserve original IDs"
                              />
                              <div
                                onClick={() => setPreserveIds(p => !p)}
                                className={`w-10 h-6 rounded-full transition-colors ${preserveIds ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                              />
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${preserveIds ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className="text-sm">Preserve original document IDs (overwrite if exists)</span>
                          </label>

                          {/* Dedupe toggle */}
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={dedupe}
                                onChange={(e) => setDedupe(e.target.checked)}
                                className="sr-only"
                                aria-label="Skip duplicates"
                              />
                              <div
                                onClick={() => setDedupe(d => !d)}
                                className={`w-10 h-6 rounded-full transition-colors ${dedupe ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                              />
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${dedupe ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className="text-sm">Skip already-imported transactions (dedupe by originalId)</span>
                          </label>
                        </div>

                    <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowImportModal(false)} className="px-3 py-2 rounded border">Cancel</button>
                      <button onClick={startImport} disabled={importLoading} className="px-3 py-2 bg-teal-500 text-white rounded disabled:opacity-50 flex items-center gap-2">
                        {importLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Start Import
                      </button>
                    </div>
                  </div>
                </Modal>
              )}

              {/* Note: we only use a single file input (preview). Start Import uses the parsed payload in memory. */}

              {/* Import result summary */}
              {importResult && (
                <div className="mt-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                  {importResult.success ? (
                    <div className="text-green-600 dark:text-green-400">Imported {importResult.imported} of {importResult.total} transactions. Skipped: {importResult.skipped}. Failed: {importResult.failed}.</div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400">Import failed: {importResult.error}</div>
                  )}
                  {importResult.reconciled !== undefined && (
                    <div className="mt-2 text-xs">
                      {importResult.reconciled ? (
                        <div className="text-green-500">Reconciliation completed. New totals: {importResult.totals ? `Balance: ${importResult.totals.balance}, Income: ${importResult.totals.totalIncome}, Expense: ${importResult.totals.totalExpense}` : 'n/a'}</div>
                      ) : (
                        <div className="text-yellow-500">Reconciliation was not performed or failed.</div>
                      )}
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside max-h-24 overflow-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err.id ? `id:${err.id} — ` : ''}{err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(importResult.overwritten && importResult.overwritten.length > 0) && (
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                      <div className="font-medium">Overwritten:</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{importResult.overwritten.length} document(s) overwritten.</div>
                      <ul className="list-disc list-inside max-h-28 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                        {importResult.overwritten.slice(0, 10).map((id, i) => (<li key={i}>{id}</li>))}
                      </ul>
                    </div>
                  )}

                  {(importResult.createdIds && importResult.createdIds.length > 0) && (
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                      <div className="font-medium">Created:</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{importResult.createdIds.length} document(s) created.</div>
                      <ul className="list-disc list-inside max-h-28 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                        {importResult.createdIds.slice(0, 10).map((id, i) => (<li key={i}>{id}</li>))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center space-x-3 p-3 text-left border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</div>
                  <div className="text-xs text-red-500 dark:text-red-400">Permanently delete your account and all data</div>
                </div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </Modal>

  {/* Clear importResult when modal closes to ensure a fresh state next open */}
  { !isOpen && importResult && setImportResult(null) }

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
        confirmText="Continue"
        type="danger"
      />

      {/* Reauthentication Dialog */}
      <Modal 
        isOpen={showReauthDialog} 
        onClose={() => {
          setShowReauthDialog(false);
          setPassword('');
          setEmailConfirmation('');
        }}
        title="Confirm Account Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                This action is permanent
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {isUserGoogleAuth 
                  ? 'Type your email address to confirm account deletion, then authenticate with Google' 
                  : 'Enter your password to confirm account deletion'}
              </p>
            </div>
          </div>
          
          {isUserGoogleAuth ? (
            <input
              type="email"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              placeholder="Type your email address to confirm"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          ) : (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowReauthDialog(false);
                setPassword('');
                setEmailConfirmation('');
              }}
              disabled={deleteLoading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReauthAndDelete}
              disabled={
                (isUserGoogleAuth && !emailConfirmation) || 
                (!isUserGoogleAuth && !password) || 
                deleteLoading
              }
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isUserGoogleAuth ? 'Authenticate' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SettingsModal;