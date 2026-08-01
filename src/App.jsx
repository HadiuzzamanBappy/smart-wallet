import React, { useState } from 'react';
import { inject } from '@vercel/analytics';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';
import { useAuth } from './hooks/useAuth';
import EntryPoint from './pages/EntryPoint';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

inject();

const AppContent = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Handle authentication flow
  if (!user) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <EntryPoint onGetStarted={() => setShowLogin(true)} />;
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