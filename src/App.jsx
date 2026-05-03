import React, { useState } from 'react';
import { inject } from '@vercel/analytics';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComponentsPage from './pages/ComponentsPage';

inject();

const AppContent = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Simple hash-based routing for dev/public components page
  if (window.location.hash === '#components') {
    return <ComponentsPage />;
  }

  // Handle authentication flow
  if (!user) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
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