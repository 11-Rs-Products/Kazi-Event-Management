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
      let userNotifs: NotificationItem[] = [];
      let globalNotifs: NotificationItem[] = [];
      let adminNotifs: NotificationItem[] = [];
      let accessRequestItems: NotificationItem[] = [];

      const publishNotifications = () => {
        const notifMap = new Map<string, NotificationItem>();
        [...userNotifs, ...globalNotifs, ...adminNotifs, ...accessRequestItems].forEach((item) => {
          notifMap.set(item.id, item);
        });

        const sorted = Array.from(notifMap.values()).sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setNotifications(sorted);
      };

      // 1. Direct User Notifications (Role changes, registrations, etc.)
      const unsubUser = onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', user.uid)),
        (snapshot) => {
          userNotifs = [];
          snapshot.forEach((docSnap) => {
            userNotifs.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
          });
          publishNotifications();
        },
        (error) => {
          console.error('Firestore user notification snapshot error:', error);
        }
      );

      // 2. Global Announcements
      const unsubGlobal = onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', 'GLOBAL')),
        (snapshot) => {
          globalNotifs = [];
          snapshot.forEach((docSnap) => {
            globalNotifs.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
          });
          publishNotifications();
        },
        (error) => {
          console.error('Firestore global notification snapshot error:', error);
        }
      );

      // 3. Super Admin Notifications
      const unsubAdmin =
        user.role === 'SUPER_ADMIN'
          ? onSnapshot(
              query(collection(db, 'notifications'), where('userId', '==', 'SUPER_ADMIN')),
              (snapshot) => {
                adminNotifs = [];
                snapshot.forEach((docSnap) => {
                  adminNotifs.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
                });
                publishNotifications();
              },
              (error) => {
                console.error('Firestore admin notification snapshot error:', error);
              }
            )
          : undefined;

      // 4. Access Requests (Super Admin)
      const unsubAccessRequests =
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
        unsubUser();
        unsubGlobal();
        unsubAdmin?.();
        unsubAccessRequests?.();
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
