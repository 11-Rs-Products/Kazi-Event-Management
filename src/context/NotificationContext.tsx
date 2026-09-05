'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '@/types';
import { useAuth } from './AuthContext';
import { isMockMode, db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { getAllEventsGroupRef } from '@/lib/firebase/paths';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getReadGlobalIds = (uid: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`kazi_read_global_${uid}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadGlobalId = (uid: string, notifId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadGlobalIds(uid);
    set.add(notifId);
    localStorage.setItem(`kazi_read_global_${uid}`, JSON.stringify(Array.from(set)));
  } catch {}
};

const saveAllReadGlobalIds = (uid: string, notifIds: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadGlobalIds(uid);
    notifIds.forEach(id => set.add(id));
    localStorage.setItem(`kazi_read_global_${uid}`, JSON.stringify(Array.from(set)));
  } catch {}
};

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
        const readGlobalSet = getReadGlobalIds(user.uid);
        const notifMap = new Map<string, NotificationItem>();

        // 1. Process direct accessRequests collection items
        const seenAccessEmails = new Set<string>();
        accessRequestItems.forEach((item) => {
          const emailMatch = item.title.match(/Access Request:\s*(\S+)/i);
          const email = emailMatch ? emailMatch[1].toLowerCase() : item.id;
          seenAccessEmails.add(email);
          notifMap.set(`accessRequest:${email}`, item);
        });

        // 2. Process super admin notifications, preventing duplicates with access requests
        adminNotifs.forEach((item) => {
          if (item.title.startsWith('Access Request:')) {
            const emailMatch = item.title.match(/Access Request:\s*(\S+)/i);
            const email = emailMatch ? emailMatch[1].toLowerCase() : item.id;
            if (seenAccessEmails.has(email)) return;
            seenAccessEmails.add(email);
            notifMap.set(`accessRequest:${email}`, item);
          } else {
            notifMap.set(item.id, item);
          }
        });

        // 3. Process direct user notifications
        userNotifs.forEach((item) => {
          notifMap.set(item.id, item);
        });

        // 4. Process global announcements with user-scoped read status
        globalNotifs.forEach((item) => {
          const isRead = Boolean(item.read || readGlobalSet.has(item.id));
          notifMap.set(item.id, { ...item, read: isRead });
        });

        const sorted = Array.from(notifMap.values()).sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setNotifications(sorted);
      };

      // 1. Direct User Notifications (Role changes, registrations, etc.)
      const unsubUser = onSnapshot(
        query(collection(db, 'notifications'), where('userId', 'in', [user.uid, user.email])),
        (snapshot) => {
          userNotifs = [];
          snapshot.forEach((docSnap) => {
            userNotifs.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
          });
          publishNotifications();
        },
        (error) => {
          console.debug('User notification snapshot notice:', error?.message || error);
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
          console.debug('Global notification snapshot notice:', error?.message || error);
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
                console.debug('Admin notification snapshot notice:', error?.message || error);
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
                console.debug('Access request snapshot notice:', error?.message || error);
              }
            )
          : undefined;

      // 5. Active Deadline Alerts (Firestore mode)
      const checkFirestoreDeadlines = async () => {
        try {
          const eventsSnap = await getDocs(
            query(getAllEventsGroupRef(), where('status', '==', 'PUBLISHED'))
          );
          const now = Date.now();
          eventsSnap.forEach(async (docSnap) => {
            const event = docSnap.data();
            if (!event.registrationDeadline) return;
            const deadline = new Date(event.registrationDeadline).getTime();
            const diffMs = deadline - now;
            const hoursLeft = diffMs / (1000 * 60 * 60);

            if (hoursLeft > 0 && hoursLeft <= 24) {
              const notifId = `deadline_${docSnap.id}`;
              const notifRef = doc(db, 'notifications', notifId);
              const notifSnap = await getDoc(notifRef);
              if (!notifSnap.exists()) {
                const roundedHours = Math.max(1, Math.round(hoursLeft));
                await setDoc(notifRef, {
                  id: notifId,
                  userId: 'GLOBAL',
                  title: 'Registration Closing Soon',
                  message: `Final call: Registration for "${event.name}" closes in ${roundedHours} ${roundedHours === 1 ? 'hour' : 'hours'}!`,
                  type: 'EVENT',
                  linkUrl: `/events/${docSnap.id}`,
                  read: false,
                  isGlobal: true,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          });
        } catch (err: any) {
          // Silently skip if Firestore COLLECTION_GROUP_ASC index is not created yet
          console.debug('Firestore deadline check skipped:', err?.message || err);
        }
      };
      checkFirestoreDeadlines();

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
    if (!user) return;

    if (isMockMode) {
      mockStore.markNotificationAsRead(id);
      return;
    }

    try {
      const item = notifications.find((n) => n.id === id);

      // 1. Access Request notification
      if (id.startsWith('accessRequest:')) {
        const rawId = id.replace('accessRequest:', '');
        try {
          await updateDoc(doc(db, 'accessRequests', rawId), { read: true });
        } catch {}
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        return;
      }

      // 2. Global announcement: user-scoped read tracking (prevents permission denied and cross-user pollution)
      if (item?.userId === 'GLOBAL' || item?.isGlobal) {
        saveReadGlobalId(user.uid, id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        return;
      }

      // 3. User direct personal notification
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
      const globalIdsToMark: string[] = [];
      const accessReqUpdates: Promise<any>[] = [];
      const personalNotifUpdates: Promise<any>[] = [];

      unread.forEach((n) => {
        if (n.id.startsWith('accessRequest:')) {
          const rawId = n.id.replace('accessRequest:', '');
          accessReqUpdates.push(
            updateDoc(doc(db, 'accessRequests', rawId), { read: true }).catch(() => {})
          );
        } else if (n.userId === 'GLOBAL' || n.isGlobal) {
          globalIdsToMark.push(n.id);
        } else {
          personalNotifUpdates.push(
            updateDoc(doc(db, 'notifications', n.id), { read: true }).catch((err) => {
              console.warn('Could not mark personal notification read:', n.id, err);
            })
          );
        }
      });

      if (globalIdsToMark.length > 0) {
        saveAllReadGlobalIds(user.uid, globalIdsToMark);
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      await Promise.all([...accessReqUpdates, ...personalNotifUpdates]);
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
