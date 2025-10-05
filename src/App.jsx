import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/User/Login';
import Header from './components/Layout/Header';
import CompactSummary from './components/Dashboard/CompactSummary';
import MinimalChatInterface from './components/Dashboard/MinimalChatInterface';
import ExpandableDetailsSection from './components/Dashboard/ExpandableDetailsSection';
import ChatWidget from './components/Dashboard/ChatWidget';

const AppContent = () => {
  const { user, refreshUserProfile } = useAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Compact Financial Summary - Always visible */}
        <CompactSummary refreshTrigger={refreshKey} onRefresh={handleRefresh} />
        
        {/* Central Chat Interface - Only on tablet+ */}
        <div className="flex justify-center">
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
