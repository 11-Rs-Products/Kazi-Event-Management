'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenure } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, doc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { useAuth } from './AuthContext';

interface TenureContextType {
  tenures: Tenure[];
  activeTenure: Tenure | null;
  activeTenureId: string;
  selectedTenureId: string;
  setSelectedTenureId: (id: string) => void;
  loading: boolean;
  refreshTenures: () => Promise<void>;
  createTenure: (data: { id: string; name?: string; displayName: string; active?: boolean }) => Promise<Tenure>;
  activateTenure: (tenureId: string) => Promise<void>;
}

const TenureContext = createContext<TenureContextType | undefined>(undefined);

export const TenureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tenures, setTenures] = useState<Tenure[]>([]);
  const [activeTenureId, setActiveTenureId] = useState<string>(DEFAULT_TENURE_ID);
  const [selectedTenureId, setSelectedTenureId] = useState<string>(DEFAULT_TENURE_ID);
  const [loading, setLoading] = useState(true);

  const fetchTenures = useCallback(async () => {
    setLoading(true);
    if (isMockMode) {
      const all = mockStore.getTenures();
      setTenures(all);
      const active = mockStore.getActiveTenure();
      if (active) {
        setActiveTenureId(active.id);
        setSelectedTenureId(prev => prev || active.id);
      }
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(collection(db, 'tenures'));
        const list: Tenure[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Tenure);
        });

        if (list.length === 0) {
          // Auto-seed default active tenure doc if collection is empty
          const defaultTenure: Tenure = {
            id: DEFAULT_TENURE_ID,
            name: DEFAULT_TENURE_ID,
            displayName: `${DEFAULT_TENURE_ID} Academic Tenure`,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'tenures', DEFAULT_TENURE_ID), defaultTenure);
          list.push(defaultTenure);
        }

        // Sort: active first, then by id descending
        list.sort((a, b) => {
          if (a.active) return -1;
          if (b.active) return 1;
          return b.id.localeCompare(a.id);
        });

        setTenures(list);
        const active = list.find((t) => t.active) || list[0];
        if (active) {
          setActiveTenureId(active.id);
          setSelectedTenureId(prev => prev || active.id);
        }
      } catch (err) {
        console.error('Failed to fetch tenures from Firestore:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTenures();
    if (isMockMode) {
      const unsub = mockStore.subscribe(() => {
        fetchTenures();
      });
      return () => {
        unsub();
      };
    }
  }, [fetchTenures]);

  const createTenure = async (data: { id: string; name?: string; displayName: string; active?: boolean }): Promise<Tenure> => {
    const formattedId = data.id.trim();
    if (!formattedId) throw new Error('Tenure ID is required.');

    if (isMockMode) {
      const created = mockStore.createTenure(
        {
          id: formattedId,
          name: data.name || formattedId,
          displayName: data.displayName.trim() || `${formattedId} Tenure`,
          active: data.active,
        },
        user
      );
      await fetchTenures();
      return created;
    } else {
      const batch = writeBatch(db);
      if (data.active) {
        // Deactivate existing
        tenures.forEach((t) => {
          if (t.active) {
            batch.update(doc(db, 'tenures', t.id), { active: false, updatedAt: new Date().toISOString() });
          }
        });
      }

      const newTenure: Tenure = {
        id: formattedId,
        name: data.name || formattedId,
        displayName: data.displayName.trim() || `${formattedId} Tenure`,
        active: !!data.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(doc(db, 'tenures', formattedId), newTenure);
      await batch.commit();
      await fetchTenures();
      return newTenure;
    }
  };

  const activateTenure = async (tenureId: string): Promise<void> => {
    if (isMockMode) {
      mockStore.setActiveTenure(tenureId, user);
      await fetchTenures();
    } else {
      const batch = writeBatch(db);
      tenures.forEach((t) => {
        batch.update(doc(db, 'tenures', t.id), {
          active: t.id === tenureId,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      await fetchTenures();
    }
  };

  const activeTenure = tenures.find((t) => t.id === activeTenureId) || tenures[0] || null;

  return (
    <TenureContext.Provider
      value={{
        tenures,
        activeTenure,
        activeTenureId,
        selectedTenureId,
        setSelectedTenureId,
        loading,
        refreshTenures: fetchTenures,
        createTenure,
        activateTenure,
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
