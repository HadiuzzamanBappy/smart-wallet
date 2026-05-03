import React, { useState } from 'react';
import Header from '../components/UI/Header';
import CompactSummary from '../components/Dashboard/CompactSummary';
import BudgetProgress from '../components/Dashboard/BudgetProgress';
import SalaryHomeCard from '../components/Dashboard/SalaryHomeCard';
import ExpandableDetailsSection from '../components/Dashboard/ExpandableDetailsSection';
import ChatWidget from '../components/UI/ChatWidget';
import AddTransactionModal from '../components/Dashboard/AddTransactionModal';
import ProfileModal from '../components/User/ProfileModal';
import SettingsModal from '../components/User/SettingsModal';
import SalaryManager from './SalaryManager';
import { ToastContainer } from '../components/UI/base/Toast';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useToast } from '../hooks/useToast';
import dynamicTranslator from '../services/dynamicTranslation';
import { APP_EVENTS } from '../config/constants';
import { updateUserProfile } from '../services/authService';

const Dashboard = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { refreshTransactions } = useTransactions();
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSalaryManager, setShowSalaryManager] = useState(false);
  const [salaryManagerMode, setSalaryManagerMode] = useState(null); // 'wizard' | 'result'

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast functionality
  const { toasts, success, removeToast } = useToast();

  // Refresh handler for header balance
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshTransactions();
      try {
        window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'header-refresh' } }));
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Profile-only refresh
  const handleProfileRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshUserProfile();
      try {
        window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'profile-refresh' } }));
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize translation
  React.useEffect(() => {
    if (userProfile?.language) {
      setCurrentLanguage(userProfile.language);
      dynamicTranslator.initializeForUser(userProfile.language);
    }
  }, [userProfile?.language]);

  const handleLanguageToggle = async () => {
    const newLanguage = currentLanguage === 'en' ? 'bn' : 'en';

    if (newLanguage === 'en') {
      await dynamicTranslator.resetToEnglish();
      setCurrentLanguage('en');
      if (user) {
        try {
          await updateUserProfile(user.uid, { language: 'en' });
        } catch (error) {
          console.error('Error updating user language preference:', error);
        }
      }
    } else {
      setCurrentLanguage('bn');
      await dynamicTranslator.translatePage('bn');
      if (user) {
        try {
          await updateUserProfile(user.uid, { language: 'bn' });
        } catch (error) {
          console.error('Error updating user language preference:', error);
        }
      }
    }
  };

  const handleTransactionUpdate = () => {
    refreshTransactions(true);
    success('Transaction updated successfully!');
    try { window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'transaction-update' } })); } catch { /* ignore */ }
  };

  const handleTransactionAdded = () => {
    refreshTransactions(true);
    success('Transaction added successfully!');
    try { window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'transaction-add' } })); } catch { /* ignore */ }
  };

  return (
    <>
      <div className="min-h-screen bg-paper-50 dark:bg-ink-950 transition-colors duration-500 relative overflow-hidden">
        {/* Subtle Atmospheric Glow - Nexus Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary-500/[0.03] dark:bg-primary-500/[0.05] rounded-full blur-[160px] pointer-events-none z-0" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-secondary-500/[0.02] dark:bg-secondary-500/[0.04] rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary-500/[0.03] dark:from-primary-500/[0.02] to-transparent pointer-events-none z-0" />

        <Header
          onAddTransaction={() => setShowAddModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          currentLanguage={currentLanguage}
          onLanguageToggle={handleLanguageToggle}
          isRefreshing={isRefreshing}
          onRefresh={handleProfileRefresh}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 pt-20 sm:pt-24 relative z-10">
          <div className="space-y-6 sm:space-y-12">
            <CompactSummary onRefresh={handleRefresh} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-8">
                <SalaryHomeCard
                  userId={user.uid}
                  onOpen={(mode) => {
                    setSalaryManagerMode(mode);
                    setShowSalaryManager(true);
                  }}
                />
                <BudgetProgress />
              </div>
              <div className="lg:col-span-8 space-y-8">
                <ExpandableDetailsSection onTransactionChange={handleTransactionUpdate} />
              </div>
            </div>
          </div>
        </main>

        <ChatWidget
          onTransactionAdded={handleTransactionAdded}
        />
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTransactionAdded}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={() => {
          success('Profile updated successfully!');
          refreshTransactions(true);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {showSalaryManager && (
        <SalaryManager
          userId={user.uid}
          initialView={salaryManagerMode}
          onClose={() => {
            setShowSalaryManager(false);
            setSalaryManagerMode(null);
          }}
        />
      )}

      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </>
  );
};

export default Dashboard;
