import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { getUserProfile } from '../services/transactionService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { encryptUserProfile } from '../utils/encryption';
import { AuthContext } from './createAuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch user profile from Firestore
        try {
          const profileResult = await getUserProfile(u.uid);
          if (profileResult.success) {
            setUserProfile(profileResult.data);
          } else {
            // Create a basic profile if none exists and persist it to Firestore (auto-migration)
            const defaultDisplayName = u.displayName || (u.providerData && u.providerData[0] && u.providerData[0].displayName) || (u.email ? String(u.email).split('@')[0] : 'User');
            const profileData = {
              uid: u.uid,
              email: u.email,
              displayName: defaultDisplayName,
              currency: 'BDT',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };

            try {
              // Encrypt and persist the profile to Firestore
              const encryptedProfile = await encryptUserProfile(profileData);
              await setDoc(doc(db, 'users', u.uid), encryptedProfile);
              setUserProfile(profileData);
            } catch (err) {
              console.error('Failed to create default user profile:', err);
              // Fall back to lightweight local profile so UI still works
              setUserProfile({ uid: u.uid, email: u.email, displayName: defaultDisplayName });
            }
          }
        } catch (err) {
          console.error('Error fetching profile during auth state change:', err);
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
    if (!user) return null;

    try {
      const profileResult = await getUserProfile(user.uid);
      if (profileResult.success) {
        setUserProfile(profileResult.data);
        // NOTE: Do NOT apply saved theme on routine profile refresh.
        // Theme should be controlled via ThemeContext and user actions (Settings or dropdown).
        // If you want to sync stored preference to ThemeContext, do so only at login/initial load.
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