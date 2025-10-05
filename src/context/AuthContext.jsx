import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/transactionService';
import { AuthContext } from './createAuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user profile from Firestore
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
      } else {
        setUser(null);
        setUserProfile(null);
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
        <LoadingSpinner 
          message="Loading your wallet..." 
          size="lg" 
          fullScreen={true}
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};