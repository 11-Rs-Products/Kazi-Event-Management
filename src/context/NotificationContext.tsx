'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '@/types';
import { useAuth } from './AuthContext';
import { isMockMode, db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    if (isMockMode) {
      const loadMockNotifs = () => {
        const notifs = mockStore.getNotifications(user.uid);
        setNotifications(notifs);
      };
      loadMockNotifs();
      const unsubscribe = mockStore.subscribe(loadMockNotifs);
      return () => unsubscribe();
    } else {
      // Real-time Firestore Listener
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [user.uid, 'GLOBAL']),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: NotificationItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
          });
          setNotifications(items);
        },
        (error) => {
          console.error('Firestore notification snapshot error:', error);
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    if (isMockMode) {
      mockStore.markNotificationAsRead(id);
      return;
    }

    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    if (isMockMode) {
      mockStore.markAllNotificationsAsRead(user.uid);
      return;
    }

    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const refreshNotifications = () => {
    if (user && isMockMode) {
      setNotifications(mockStore.getNotifications(user.uid));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
