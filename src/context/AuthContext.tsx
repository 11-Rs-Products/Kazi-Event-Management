'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/types';
import { normalizeDisplayName } from '@/lib/utils/nameNormalization';
import { isMockMode, auth, googleProvider, db } from '@/lib/firebase/config';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { INITIAL_SUPER_ADMIN_EMAILS } from '@/lib/firebase/mockData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAccessDenied: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (isMockMode) {
      // Mock mode initialization
      const active = mockStore.getActiveUser();
      setUser(active);
      setLoading(false);

      const unsubscribe = mockStore.subscribe(() => {
        setUser(mockStore.getActiveUser());
      });
      return () => unsubscribe();
    } else {
      // Real Firebase Auth Listener
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);
        if (fbUser && fbUser.email) {
          try {
            await handleFirebaseUserLogin(fbUser);
          } catch (err) {
            console.error('Login error:', err);
            setIsAccessDenied(true);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleFirebaseUserLogin = async (fbUser: FirebaseUser) => {
    const email = fbUser.email!.trim().toLowerCase();

    const isInitialSuperAdmin = INITIAL_SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === email);

    // Check allowed users collection, bypass if initial super admin
    const allowedDocRef = doc(db, 'allowedUsers', email);
    const allowedSnap = await getDoc(allowedDocRef);

    if (!allowedSnap.exists() && !isInitialSuperAdmin) {
      setIsAccessDenied(true);
      await firebaseSignOut(auth);
      router.push('/access-denied');
      return;
    }

    setIsAccessDenied(false);

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const existingProfile = userSnap.data() as UserProfile;
      // If initial super admin, ensure role is SUPER_ADMIN
      let currentRole = existingProfile.role;
      if (isInitialSuperAdmin && currentRole !== 'SUPER_ADMIN') {
        currentRole = 'SUPER_ADMIN';
        await updateDoc(userDocRef, { role: 'SUPER_ADMIN', lastLoginAt: new Date().toISOString() });
      } else {
        await updateDoc(userDocRef, { lastLoginAt: new Date().toISOString() });
      }

      setUser({
        ...existingProfile,
        role: currentRole,
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      // Create new User profile with normalized name
      const normalizedName = normalizeDisplayName(fbUser.displayName || 'Kaziranga Student');
      const defaultRole: UserRole = isInitialSuperAdmin ? 'SUPER_ADMIN' : 'USER';

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email!,
        name: normalizedName,
        phone: '',
        region: '',
        level: '',
        programme: '',
        role: defaultRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        avatarUrl: fbUser.photoURL || undefined,
      };

      await setDoc(userDocRef, newProfile);
      setUser(newProfile);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setIsAccessDenied(false);

    if (isMockMode) {
      // In mock mode, default to active mock user or prompt
      const currentMock = mockStore.getActiveUser() || mockStore.getUsers()[0];
      mockStore.setActiveUser(currentMock);
      setUser(currentMock);
      setLoading(false);
      router.push('/dashboard');
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await handleFirebaseUserLogin(result.user);
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        alert('Authentication failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isMockMode) {
      mockStore.setActiveUser(null);
      setUser(null);
      router.push('/login');
      return;
    }

    await firebaseSignOut(auth);
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    if (isMockMode) {
      const updated = mockStore.updateUserProfile(user.uid, data);
      setUser(updated);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    // Ensure email & role are not mutated by user profile edit call
    delete (updates as any).role;
    delete (updates as any).email;

    await updateDoc(docRef, updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const switchDemoRole = (role: UserRole) => {
    if (!isMockMode) return;
    const targetUser = mockStore.getUsers().find((u) => u.role === role) || mockStore.getUsers()[0];
    mockStore.setActiveUser(targetUser);
    setUser(targetUser);
  };

  const refreshUser = () => {
    if (isMockMode) {
      setUser(mockStore.getActiveUser());
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAccessDenied,
        loginWithGoogle,
        logout,
        updateProfile,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
