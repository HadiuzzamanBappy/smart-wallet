import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import dynamicTranslator from './services/dynamicTranslation';
import Login from './components/User/Login';
import Header from './components/Layout/Header';
import CompactSummary from './components/Dashboard/CompactSummary';
import BudgetProgress from './components/Dashboard/BudgetProgress';
import MinimalChatInterface from './components/Dashboard/MinimalChatInterface';
import ExpandableDetailsSection from './components/Dashboard/ExpandableDetailsSection';
import ChatWidget from './components/Dashboard/ChatWidget';
import SettingsModal from './components/User/SettingsModal';
import Modal from './components/UI/Modal';

const AppContent = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Initialize translation based on user's language preference
  React.useEffect(() => {
    if (userProfile?.language) {
      console.log('User preferred language:', userProfile.language);
      dynamicTranslator.initializeForUser(userProfile.language);
    }
  }, [userProfile?.language]);

  if (!user) {
    return <Login />;
  }

  const handleTransactionAdded = async () => {
    // Refresh user profile immediately to update balance in header
    await refreshUserProfile();

    // Trigger refresh of all components
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh user profile to update balance in header
      await refreshUserProfile();
      // Trigger refresh of all components
      setRefreshKey(prev => prev + 1);
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header isRefreshing={isRefreshing} />

      {/* Main Content */}
  <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 space-y-6 md:space-y-6 lg:space-y-8">

        {/* Compact Financial Summary - Always visible */}
        <CompactSummary refreshTrigger={refreshKey} onRefresh={handleRefresh} />

        {/* Budget Progress - Always visible */}
        <BudgetProgress key={`budget-${refreshKey}`} onSettingsClick={() => setSettingsOpen(true)} />

        {/* Central Chat Interface - Only on tablet+ */}
        <div className="mt-2 md:mt-0">
          <MinimalChatInterface onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Expandable Detail Sections - Always visible, no extra container */}
        <ExpandableDetailsSection key={`details-${refreshKey}`} onTransactionChange={handleTransactionAdded} />
      </main>

      {/* Traditional Chat Widget - Always available, responsive positioning */}
      <div className="md:hidden">
        <ChatWidget onTransactionAdded={handleTransactionAdded} />
      </div>
      <div className="hidden md:block">
        <ChatWidget onTransactionAdded={handleTransactionAdded} />
      </div>

      {/* Settings Modal */}
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <SettingsModal />
      </Modal>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
