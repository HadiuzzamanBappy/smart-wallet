import React from 'react';
import { inject } from '@vercel/analytics';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';
import { useAuth } from './hooks/useAuth';
import EntryPoint from './pages/EntryPoint';
import Dashboard from './pages/Dashboard';

inject();

const AppContent = () => {
  const { user } = useAuth();

  // Handle authentication flow
  if (!user) {
    return <EntryPoint />;
  }

  return <Dashboard />;
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