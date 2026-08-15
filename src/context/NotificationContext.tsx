'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '@/types';
import { useAuth } from './AuthContext';
import { isMockMode, db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
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
      const targetUserIds = user.role === 'SUPER_ADMIN' ? [user.uid, 'GLOBAL', 'SUPER_ADMIN'] : [user.uid, 'GLOBAL'];
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', targetUserIds)
      );

      let notificationItems: NotificationItem[] = [];
      let accessRequestItems: NotificationItem[] = [];

      const publishNotifications = () => {
        setNotifications(
          [...notificationItems, ...accessRequestItems].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
        );
      };

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          notificationItems = [];
          snapshot.forEach((docSnap) => {
            notificationItems.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
          });
          publishNotifications();
        },
        (error) => {
          console.error('Firestore notification snapshot error:', error);
        }
      );

      const unsubscribeAccessRequests =
        user.role === 'SUPER_ADMIN'
          ? onSnapshot(
              query(collection(db, 'accessRequests'), where('status', '==', 'PENDING')),
              (snapshot) => {
                accessRequestItems = [];
                snapshot.forEach((docSnap) => {
                  const request = docSnap.data();
                  accessRequestItems.push({
                    id: `accessRequest:${docSnap.id}`,
                    userId: 'SUPER_ADMIN',
                    title: `Access Request: ${request.email}`,
                    message: `Student ${request.email} has requested access to the Kaziranga House Portal.${request.note ? ` Note: "${request.note}"` : ''}`,
                    type: 'WARNING',
                    linkUrl: `/super-admin/allowed-users?email=${encodeURIComponent(request.email || '')}`,
                    read: Boolean(request.read),
                    createdAt: request.createdAt,
                  });
                });
                publishNotifications();
              },
              (error) => {
                console.error('Firestore access request snapshot error:', error);
              }
            )
          : undefined;

      return () => {
        unsubscribe();
        unsubscribeAccessRequests?.();
      };
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    if (isMockMode) {
      mockStore.markNotificationAsRead(id);
      return;
    }

    try {
      if (id.startsWith('accessRequest:')) {
        await updateDoc(doc(db, 'accessRequests', id.replace('accessRequest:', '')), { read: true });
        return;
      }

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
        unread.map((n) => {
          if (n.id.startsWith('accessRequest:')) {
            return updateDoc(doc(db, 'accessRequests', n.id.replace('accessRequest:', '')), { read: true });
          }

          return updateDoc(doc(db, 'notifications', n.id), { read: true });
        })
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
