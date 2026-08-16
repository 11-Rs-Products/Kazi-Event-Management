'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/types';
import { normalizeDisplayName } from '@/lib/utils/nameNormalization';
import { isMockMode, auth, googleProvider, db } from '@/lib/firebase/config';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { INITIAL_SUPER_ADMIN_EMAILS } from '@/lib/firebase/mockData';

interface AuthContextType {
  user: UserProfile | null;
  deniedEmail: string | null;
  loading: boolean;
  isAccessDenied: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);
  const router = useRouter();

  const handleDemotionCheck = (newRole: UserRole) => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/super-admin') && newRole !== 'SUPER_ADMIN') {
      console.warn('[AuthContext] Super Admin role demoted. Redirecting away from privileged route:', currentPath);
      router.replace('/dashboard');
    } else if (currentPath.startsWith('/admin') && newRole === 'USER') {
      console.warn('[AuthContext] Admin role demoted to User. Redirecting away from privileged route:', currentPath);
      router.replace('/dashboard');
    }
  };

  const handleFirebaseUserLogin = async (fbUser: FirebaseUser): Promise<boolean> => {
    const email = fbUser.email!.trim().toLowerCase();
    const isInitialSuperAdmin = INITIAL_SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === email);

    // Check allowed users collection, bypass if initial super admin
    const allowedDocRef = doc(db, 'allowedUsers', email);
    const allowedSnap = await getDoc(allowedDocRef);

    if (!allowedSnap.exists() && !isInitialSuperAdmin) {
      setIsAccessDenied(true);
      setDeniedEmail(email);
      setUser(null);
      router.push('/access-denied');
      return false;
    }

    setIsAccessDenied(false);
    setDeniedEmail(null);

    // Ensure initial profile doc exists in Firestore if first login
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      await updateDoc(userDocRef, { lastLoginAt: new Date().toISOString() });
    } else {
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
    }
    return true;
  };

  useEffect(() => {
    if (isMockMode) {
      const active = mockStore.getActiveUser();
      setUser(active);
      setLoading(false);

      const unsubscribe = mockStore.subscribe(() => {
        const activeUser = mockStore.getActiveUser();
        setUser(activeUser);
        if (activeUser) {
          handleDemotionCheck(activeUser.role);
        }
      });
      return () => unsubscribe();
    } else {
      let unsubscribeProfileDoc: Unsubscribe | null = null;

      // Real Firebase Auth Listener with real-time Firestore profile subscription
      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);

        if (unsubscribeProfileDoc) {
          unsubscribeProfileDoc();
          unsubscribeProfileDoc = null;
        }

        if (fbUser && fbUser.email) {
          try {
            const isAllowed = await handleFirebaseUserLogin(fbUser);
            if (!isAllowed) {
              setLoading(false);
              return;
            }

            // Real-time Firestore Listener for logged-in user profile / role changes
            const userDocRef = doc(db, 'users', fbUser.uid);
            unsubscribeProfileDoc = onSnapshot(
              userDocRef,
              (snapshot) => {
                if (snapshot.exists()) {
                  const liveProfile = { uid: snapshot.id, ...snapshot.data() } as UserProfile;
                  console.log('[AuthContext] Real-time profile/role update received:', liveProfile.role);
                  setUser(liveProfile);
                  handleDemotionCheck(liveProfile.role);
                }
                setLoading(false);
              },
              (err) => {
                console.error('[AuthContext] Profile snapshot listener error:', err);
                setLoading(false);
              }
            );
          } catch (err) {
            console.error('Login error:', err);
            setIsAccessDenied(true);
            setUser(null);
            router.push('/access-denied');
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        if (unsubscribeProfileDoc) unsubscribeProfileDoc();
        unsubscribeAuth();
      };
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setIsAccessDenied(false);

    if (isMockMode) {
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
        const isAllowed = await handleFirebaseUserLogin(result.user);
        if (isAllowed) {
          router.push('/dashboard');
        }
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

  const refreshUser = async () => {
    if (isMockMode) {
      setUser(mockStore.getActiveUser());
      return;
    }

    const fbUser = auth.currentUser;
    if (!fbUser) {
      setUser(null);
      return;
    }

    const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
    if (userSnap.exists()) {
      setUser({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        deniedEmail,
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
