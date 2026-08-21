'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenure } from '@/types';
import { db, isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, doc, getDocs, setDoc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { useAuth } from './AuthContext';

interface TenureContextType {
  tenures: Tenure[];
  activeTenure: Tenure | null;
  activeTenureId: string;
  loading: boolean;
  createTenure: (data: { id: string; displayName?: string; active?: boolean }) => Promise<void>;
  activateTenure: (tenureId: string) => Promise<void>;
  refreshTenures: () => Promise<void>;
}

const TenureContext = createContext<TenureContextType | undefined>(undefined);

export const TenureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tenures, setTenures] = useState<Tenure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenures = useCallback(async () => {
    try {
      if (isMockMode) {
        const list = mockStore.getTenures();
        setTenures(list);
      } else {
        const snap = await getDocs(query(collection(db, 'tenures'), orderBy('createdAt', 'desc')));
        if (!snap.empty) {
          const list: Tenure[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Tenure, 'id'>),
          }));
          setTenures(list);
        } else {
          // Fallback to default
          setTenures([
            {
              id: DEFAULT_TENURE_ID,
              name: DEFAULT_TENURE_ID,
              displayName: `${DEFAULT_TENURE_ID} Academic Tenure`,
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.warn('[TenureContext] Failed to load tenures, using defaults:', err);
      setTenures([
        {
          id: DEFAULT_TENURE_ID,
          name: DEFAULT_TENURE_ID,
          displayName: `${DEFAULT_TENURE_ID} Academic Tenure`,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenures();
  }, [fetchTenures]);

  const activeTenure = tenures.find((t) => t.active) || tenures[0] || null;
  const activeTenureId = activeTenure ? activeTenure.id : DEFAULT_TENURE_ID;

  const createTenure = async ({
    id,
    displayName,
    active = false,
  }: {
    id: string;
    displayName?: string;
    active?: boolean;
  }) => {
    const cleanId = id.trim();
    const cleanName = displayName?.trim() || `${cleanId} Academic Tenure`;

    if (isMockMode) {
      if (user) {
        mockStore.createTenure(
          {
            id: cleanId,
            displayName: cleanName,
            active,
          },
          user
        );
      }
      await fetchTenures();
      return;
    }

    const tenureRef = doc(db, 'tenures', cleanId);

    if (active) {
      // Deactivate all others
      const batch = writeBatch(db);
      tenures.forEach((t) => {
        if (t.active) {
          batch.update(doc(db, 'tenures', t.id), { active: false, updatedAt: serverTimestamp() });
        }
      });
      batch.set(tenureRef, {
        id: cleanId,
        name: cleanId,
        displayName: cleanName,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(tenureRef, {
        id: cleanId,
        name: cleanId,
        displayName: cleanName,
        active: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await fetchTenures();
  };

  const activateTenure = async (tenureId: string) => {
    if (isMockMode) {
      if (user) {
        mockStore.setActiveTenure(tenureId, user);
      }
      await fetchTenures();
      return;
    }

    const batch = writeBatch(db);
    tenures.forEach((t) => {
      batch.update(doc(db, 'tenures', t.id), {
        active: t.id === tenureId,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    await fetchTenures();
  };

  return (
    <TenureContext.Provider
      value={{
        tenures,
        activeTenure,
        activeTenureId,
        loading,
        createTenure,
        activateTenure,
        refreshTenures: fetchTenures,
      }}
    >
      {children}
    </TenureContext.Provider>
  );
};

export const useTenure = () => {
  const context = useContext(TenureContext);
  if (!context) {
    throw new Error('useTenure must be used within a TenureProvider');
  }
  return context;
};
