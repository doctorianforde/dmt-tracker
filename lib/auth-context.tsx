'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile, logAccess } from './firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  // Whether the signed-in user has clicked their email confirmation link.
  // firestore.rules also require this for everything past sign-in.
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  // Re-checks with Firebase after the user clicks the link; returns the result.
  refreshVerification: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => !!auth);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(!!firebaseUser?.emailVerified);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(result.user.uid);
    setUserProfile(profile);
    if (profile) {
      logAccess({ actorUid: profile.uid, actorName: profile.name, actorRole: profile.role, action: 'login' });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: result.user.uid,
      name,
      email,
      role: 'student',
    };
    await createUserProfile(newProfile);
    setUserProfile(newProfile);
    await sendVerificationEmailTo(result.user);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  // Emails a Firebase password-reset link. Firebase's email-enumeration
  // protection means this succeeds whether or not the account exists.
  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (!auth?.currentUser) throw new Error('Not signed in');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshVerification = async () => {
    const current = auth?.currentUser;
    if (!current) return false;
    await current.reload();
    if (current.emailVerified) {
      // Refresh the ID token so firestore.rules see email_verified = true.
      await current.getIdToken(true);
    }
    setEmailVerified(current.emailVerified);
    return current.emailVerified;
  };

  // Firebase requires a recent sign-in to change the password, so confirm
  // the current one first.
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = auth?.currentUser;
    if (!current?.email) throw new Error('Not signed in');
    await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, currentPassword));
    await updatePassword(current, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        emailVerified,
        signIn,
        signUp,
        signOut,
        resetPassword,
        sendVerificationEmail,
        refreshVerification,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

async function sendVerificationEmailTo(user: User) {
  try {
    await sendEmailVerification(user);
  } catch (err) {
    // Don't fail sign-up over it — the verify screen offers "Resend email".
    console.error('Failed to send verification email:', err);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
