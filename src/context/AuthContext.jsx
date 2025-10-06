import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/transactionService';
import { AuthContext } from './createAuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply theme to document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
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
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user profile from Firestore
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
          // Apply saved theme preference or default to system
          const savedTheme = profileResult.data.theme || 'system';
          applyTheme(savedTheme);
        } else {
          // Create a basic profile if none exists
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            theme: 'system'
          });
          applyTheme('system');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        // Apply system theme for non-authenticated users
        applyTheme('system');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to refresh user profile from Firebase
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const profileResult = await getUserProfile(user.uid);
      if (profileResult.success) {
        setUserProfile(profileResult.data);
        // Apply saved theme preference
        const savedTheme = profileResult.data.theme || 'system';
        applyTheme(savedTheme);
        return profileResult.data;
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
    return null;
  };

  const value = {
    user,
    userProfile,
    loading,
    setUserProfile,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your wallet...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};