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
import { exportUserData, deleteAllUserData } from '../../services/transactionService';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
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
              {isUserGoogleAuth ? 'Confirm & Authenticate' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SettingsModal;