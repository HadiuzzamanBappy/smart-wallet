import React, { useState } from 'react';
import Header from '../components/Dashboard/Header';
import CompactSummary from '../components/Dashboard/CompactSummary';
import BudgetProgress from '../components/Dashboard/BudgetProgress';
import SalaryHomeCard from '../components/Dashboard/SalaryHomeCard';
import ExpandableDetailsSection from '../components/Dashboard/ExpandableDetailsSection';
import ChatWidget from '../components/Dashboard/ChatWidget';
import AddTransactionModal from '../components/UI/AddTransactionModal';
import ProfileModal from '../components/User/ProfileModal';
import SettingsModal from '../components/User/SettingsModal';
import SalaryManager from './SalaryManager';
import { ToastContainer } from '../components/UI/base/Toast';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useToast } from '../hooks/useToast';
import dynamicTranslator from '../services/dynamicTranslation';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { APP_EVENTS } from '../config/constants';

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
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { language: 'en' });
        } catch (error) {
          console.error('Error updating user language preference:', error);
        }
      }
    } else {
      setCurrentLanguage('bn');
      await dynamicTranslator.translatePage('bn');
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { language: 'bn' });
        } catch (error) {
          console.error('Error updating user language preference:', error);
        }
      }
    }
  };

  const handleTransactionUpdate = () => {
    refreshTransactions();
    success('Transaction updated successfully!');
    try { window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'transaction-update' } })); } catch { /* ignore */ }
  };

  const handleTransactionAdded = () => {
    refreshTransactions();
    success('Transaction added successfully!');
    try { window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'transaction-add' } })); } catch { /* ignore */ }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header
          onAddTransaction={() => setShowAddModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          currentLanguage={currentLanguage}
          onLanguageToggle={handleLanguageToggle}
          isRefreshing={isRefreshing}
          onRefresh={handleProfileRefresh}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">
            <CompactSummary onRefresh={handleRefresh} />
            <BudgetProgress onSettingsClick={() => setShowProfileModal(true)} />
            <SalaryHomeCard
              userId={user.uid}
              onOpen={(mode) => {
                setSalaryManagerMode(mode);
                setShowSalaryManager(true);
              }}
            />
            <ExpandableDetailsSection onTransactionChange={handleTransactionUpdate} />
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
          refreshTransactions();
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
