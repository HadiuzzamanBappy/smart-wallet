import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || 'User',
      currency: 'BDT',
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  // Try popup first (fastest UX). Some environments with Cross-Origin-Opener-Policy or
  // other restrictions block access to popup.window.closed or otherwise prevent popup flows.
  // If the popup approach fails with a COOP/blocked error, fall back to redirect flow which
  // does not rely on window.opener/window.closed checks.
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || 'User',
        currency: 'BDT',
        balance: 0,
        totalIncome: 0,
        totalExpense: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }

    return { success: true, user };
  } catch (popupError) {
    // Detect likely COOP/COEP / popup-blocking scenarios and fall back to redirect
    const message = popupError?.message || '';
    const code = popupError?.code || '';
    const isCoopOrBlocked = code === 'auth/operation-not-supported-in-this-environment'
      || message.includes('Cross-Origin-Opener-Policy')
      || /blocked a frame/i.test(message)
      || /popup blocked/i.test(message);

    if (isCoopOrBlocked) {
      try {
        await signInWithRedirect(auth, provider);
        // The redirect will navigate away; the caller should handle the redirect result on app load
        return { success: true, redirect: true, message: 'Using redirect flow due to popup restrictions' };
      } catch (redirectErr) {
        return { success: false, error: redirectErr?.message || 'Redirect sign-in failed', code: redirectErr?.code };
      }
    }

    return { success: false, error: message || String(popupError), code };
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }

};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Attempt to delete the currently signed-in Firebase Auth user.
 * Note: Deleting an Auth user often requires recent authentication. Callers should handle re-auth flow if needed.
 */
export const deleteAuthUser = async () => {
  try {
    const u = auth.currentUser;
    if (!u) throw new Error('No authenticated user');

    await firebaseDeleteUser(u);
    return { success: true };
  } catch (error) {
    console.error('Error deleting auth user:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Reauthenticate the current user with their password (for email/password users).
 * Useful to refresh credentials before sensitive actions (delete).
 */
export const reauthenticateUser = async (password) => {
  try {
    const u = auth.currentUser;
    if (!u) throw new Error('No authenticated user');
    if (!u.email) throw new Error('User has no email');

    const cred = EmailAuthProvider.credential(u.email, password);
    await reauthenticateWithCredential(u, cred);
    return { success: true };
  } catch (error) {
    console.error('Reauthentication failed:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Reauthenticate Google users using popup.
 * For Google users who don't have a password in our system.
 */
export const reauthenticateWithGoogle = async () => {
  try {
    const u = auth.currentUser;
    if (!u) throw new Error('No authenticated user');

    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(u, provider);
    return { success: true };
  } catch (error) {
    console.error('Google reauthentication failed:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Check if current user signed in with Google
 */
export const isGoogleUser = () => {
  const u = auth.currentUser;
  if (!u) return false;
  
  // Check if user has Google provider in their providerData
  return u.providerData.some(provider => provider.providerId === 'google.com');
};

/**
 * Reauthenticate with email confirmation for extra security.
 * This requires the user to type their email address to confirm deletion.
 */
export const confirmEmailForDeletion = async (emailInput) => {
  try {
    const u = auth.currentUser;
    if (!u) throw new Error('No authenticated user');
    if (!u.email) throw new Error('User has no email');
    
    // Simple email confirmation check
    if (emailInput.toLowerCase().trim() !== u.email.toLowerCase().trim()) {
      throw new Error('Email does not match your account email');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};