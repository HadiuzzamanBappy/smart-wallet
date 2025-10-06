import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useTransactions } from './hooks/useTransactions';
import dynamicTranslator from './services/dynamicTranslation';
import { db } from './config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Login from './components/User/Login';
import Header from './components/Layout/Header';
import CompactSummary from './components/Dashboard/CompactSummary';
import BudgetProgress from './components/Dashboard/BudgetProgress';
import ExpandableDetailsSection from './components/Dashboard/ExpandableDetailsSection';
import TransactionList from './components/Dashboard/TransactionList';
import ChatWidget from './components/Dashboard/ChatWidget';
import AddTransactionModal from './components/Transaction/AddTransactionModal';
import ProfileModal from './components/User/ProfileModal';
import SettingsModal from './components/User/SettingsModal';
import { ToastContainer } from './components/UI/Toast';
import './App.css';

const AppContent = () => {
  const { user, userProfile } = useAuth();
  const { refreshTransactions } = useTransactions();
  const [currentLanguage, setCurrentLanguage] = React.useState('en');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
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
      // Refresh user profile to update balance
      if (user?.uid) {
        // The balance will be updated automatically through AuthContext
        // when transactions are refreshed
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize translation based on user's language preference
  React.useEffect(() => {
    if (userProfile?.language) {
      console.log('User preferred language:', userProfile.language);
      setCurrentLanguage(userProfile.language);
      dynamicTranslator.initializeForUser(userProfile.language);
    }
  }, [userProfile?.language]);

  // Transactions are now managed by TransactionContext

  const handleLanguageToggle = async () => {
    const newLanguage = currentLanguage === 'en' ? 'bn' : 'en';
    
    if (newLanguage === 'en') {
      // Reset to English properly
      await dynamicTranslator.resetToEnglish();
      setCurrentLanguage('en');
      
      // Update user preferences
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { language: 'en' });
        } catch (error) {
          console.error('Error updating user language preference:', error);
        }
      }
    } else {
      // Switch to Bengali
      setCurrentLanguage('bn');
      await dynamicTranslator.translatePage('bn');
      
      // Update user preferences
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
  };

  const handleTransactionAdded = () => {
    refreshTransactions();
    success('Transaction added successfully!');
  };

  if (!user) {
    return <Login />;
  }

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
          onRefresh={handleRefresh}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-8">
            {/* Summary Cards */}
            <CompactSummary onRefresh={handleRefresh} />

            {/* Budget Progress */}
            {/* Open Profile modal from the budget card so users can set their monthly budget there */}
            <BudgetProgress onSettingsClick={() => setShowProfileModal(true)} />

            {/* Expandable Details Section */}
            <ExpandableDetailsSection onTransactionChange={handleTransactionUpdate} />
          </div>
        </main>

        {/* Chat Widget */}
        <ChatWidget 
          onTransactionAdded={handleTransactionAdded}
        />
      </div>

      {/* Modals */}
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
          refreshTransactions(); // Refresh to apply any currency changes
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts}
        removeToast={removeToast}
      />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;