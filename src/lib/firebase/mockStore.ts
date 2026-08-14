import { AllowedUser, AuditLog, EventItem, NotificationItem, Registration, UserProfile, UserRole } from '@/types';
import { INITIAL_ALLOWED_USERS, INITIAL_AUDIT_LOGS, INITIAL_EVENTS, INITIAL_NOTIFICATIONS, INITIAL_REGISTRATIONS, INITIAL_SUPER_ADMIN_EMAILS, INITIAL_USERS } from './mockData';

class MockStore {
  private users: UserProfile[];
  private allowedUsers: AllowedUser[];
  private events: EventItem[];
  private registrations: Registration[];
  private notifications: NotificationItem[];
  private auditLogs: AuditLog[];
  private activeUser: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.users = JSON.parse(localStorage.getItem('kazi_users') || 'null') || INITIAL_USERS;
      this.allowedUsers = JSON.parse(localStorage.getItem('kazi_allowed_users') || 'null') || INITIAL_ALLOWED_USERS;
      this.events = JSON.parse(localStorage.getItem('kazi_events') || 'null') || INITIAL_EVENTS;
      this.registrations = JSON.parse(localStorage.getItem('kazi_registrations') || 'null') || INITIAL_REGISTRATIONS;
      this.notifications = JSON.parse(localStorage.getItem('kazi_notifications') || 'null') || INITIAL_NOTIFICATIONS;
      this.auditLogs = JSON.parse(localStorage.getItem('kazi_audit_logs') || 'null') || INITIAL_AUDIT_LOGS;

      const savedActiveUser = localStorage.getItem('kazi_active_user');
      if (savedActiveUser) {
        this.activeUser = JSON.parse(savedActiveUser);
      } else {
        // Default to initial Super Admin 1 for rich demo experience
        this.activeUser = this.users[0];
      }
    } else {
      this.users = INITIAL_USERS;
      this.allowedUsers = INITIAL_ALLOWED_USERS;
      this.events = INITIAL_EVENTS;
      this.registrations = INITIAL_REGISTRATIONS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.activeUser = INITIAL_USERS[0];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kazi_users', JSON.stringify(this.users));
      localStorage.setItem('kazi_allowed_users', JSON.stringify(this.allowedUsers));
      localStorage.setItem('kazi_events', JSON.stringify(this.events));
      localStorage.setItem('kazi_registrations', JSON.stringify(this.registrations));
      localStorage.setItem('kazi_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('kazi_audit_logs', JSON.stringify(this.auditLogs));
      if (this.activeUser) {
        localStorage.setItem('kazi_active_user', JSON.stringify(this.activeUser));
      } else {
        localStorage.removeItem('kazi_active_user');
      }
    }
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Active User / Auth
  public getActiveUser(): UserProfile | null {
    return this.activeUser;
  }

  public setActiveUser(user: UserProfile | null) {
    this.activeUser = user;
    this.save();
  }

  public isEmailAllowed(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    return this.allowedUsers.some((u) => u.email.trim().toLowerCase() === cleanEmail);
  }

  // Users
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getUserById(uid: string): UserProfile | undefined {
    return this.users.find((u) => u.uid === uid);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    const clean = email.trim().toLowerCase();
    return this.users.find((u) => u.email.trim().toLowerCase() === clean);
  }

  public updateUserProfile(uid: string, updates: Partial<UserProfile>): UserProfile {
    const index = this.users.findIndex((u) => u.uid === uid);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (this.activeUser && this.activeUser.uid === uid) {
        this.activeUser = this.users[index];
      }
      this.save();
      return this.users[index];
    }
    throw new Error('User not found');
  }

  public updateUserRole(targetUid: string, newRole: UserRole, actorUser: UserProfile): UserProfile {
    const target = this.getUserById(targetUid);
    if (!target) throw new Error('Target user not found');

    const oldRole = target.role;
    target.role = newRole;
    target.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'ROLE_CHANGED',
      target: `${target.name} (${target.email})`,
      timestamp: new Date().toISOString(),
      metadata: { oldRole, newRole },
    });

    this.addNotification({
      userId: target.uid,
      title: 'Role Updated 👑',
      message: `Your account access role has been updated from ${oldRole} to ${newRole}.`,
      type: 'ROLE_CHANGE',
    });

    this.save();
    return target;
  }

  // Allowed Users
  public getAllowedUsers(): AllowedUser[] {
    return this.allowedUsers;
  }

  public replaceAllowedUsers(newEmails: string[], actorUser: UserProfile, filename: string): { total: number; batchId: string } {
    const batchId = 'batch_' + Date.now();
    const importedAt = new Date().toISOString();

    const previousCount = this.allowedUsers.length;
    this.allowedUsers = newEmails.map((email) => ({
      email: email.trim().toLowerCase(),
      importBatchId: batchId,
      importedAt,
    }));

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'ALLOWED_USERS_REPLACED',
      target: 'allowedUsers Collection',
      timestamp: importedAt,
      metadata: {
        totalValidEmails: newEmails.length,
        replacedPreviousCount: previousCount,
        filename,
        batchId,
      },
    });

    this.save();
    return { total: newEmails.length, batchId };
  }

  // Events
  public getEvents(): EventItem[] {
    return this.events;
  }

  public getEventById(id: string): EventItem | undefined {
    return this.events.find((e) => e.id === id);
  }

  public createEvent(eventData: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt' | 'currentRegistrationCount'>, actorUser: UserProfile): EventItem {
    const newEvent: EventItem = {
      ...eventData,
      id: 'evt_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentRegistrationCount: 0,
    };
    this.events.unshift(newEvent);

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'EVENT_CREATED',
      target: newEvent.name,
      timestamp: new Date().toISOString(),
      metadata: { eventId: newEvent.id, status: newEvent.status },
    });

    if (newEvent.status === 'PUBLISHED') {
      this.addNotification({
        userId: 'GLOBAL',
        title: 'New Event Published! 🎉',
        message: `${newEvent.name} is now open for registration.`,
        type: 'EVENT',
        linkUrl: `/events/${newEvent.id}`,
        isGlobal: true,
      });
    }

    this.save();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<EventItem>, actorUser: UserProfile): EventItem {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');

    const oldEvent = this.events[index];
    const updated = {
      ...oldEvent,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.events[index] = updated;

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'EVENT_UPDATED',
      target: updated.name,
      timestamp: new Date().toISOString(),
      metadata: { eventId: id, changedKeys: Object.keys(updates) },
    });

    if (oldEvent.status !== 'PUBLISHED' && updated.status === 'PUBLISHED') {
      this.addNotification({
        userId: 'GLOBAL',
        title: 'Event Published! 📢',
        message: `${updated.name} has been published and is open for registration.`,
        type: 'EVENT',
        linkUrl: `/events/${updated.id}`,
        isGlobal: true,
      });
    }

    this.save();
    return updated;
  }

  // Registrations
  public getRegistrations(): Registration[] {
    return this.registrations;
  }

  public getRegistrationsForUser(userId: string): Registration[] {
    return this.registrations.filter((r) => r.userId === userId);
  }

  public getRegistrationsForEvent(eventId: string): Registration[] {
    return this.registrations.filter((r) => r.eventId === eventId);
  }

  public registerForEvent(
    event: EventItem,
    user: UserProfile,
    formData: { phone: string; region: string; level: string; programme: string }
  ): Registration {
    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      throw new Error('Registration deadline for this event has passed.');
    }
    // Check event status
    if (event.status !== 'PUBLISHED') {
      throw new Error('Registration is not currently open for this event.');
    }
    // Check capacity
    const currentRegs = this.getRegistrationsForEvent(event.id).filter((r) => r.status === 'CONFIRMED');
    if (event.maximumParticipants && currentRegs.length >= event.maximumParticipants) {
      throw new Error('Maximum participant capacity for this event has been reached.');
    }
    // Check duplicate
    const existing = this.registrations.find((r) => r.eventId === event.id && r.userId === user.uid && r.status === 'CONFIRMED');
    if (existing) {
      throw new Error('You are already registered for this event.');
    }

    // Save phone to profile if updated or newly entered
    if (formData.phone && formData.phone !== user.phone) {
      this.updateUserProfile(user.uid, {
        phone: formData.phone,
        region: formData.region,
        level: formData.level,
        programme: formData.programme,
      });
    }

    const newRegistration: Registration = {
      id: 'reg_' + Date.now(),
      eventId: event.id,
      eventTitle: event.name,
      userId: user.uid,
      nameSnapshot: user.name,
      emailSnapshot: user.email,
      phoneSnapshot: formData.phone,
      regionSnapshot: formData.region,
      levelSnapshot: formData.level,
      programmeSnapshot: formData.programme,
      registrationType: event.registrationType,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.registrations.unshift(newRegistration);

    // Increment count on event
    const evtIndex = this.events.findIndex((e) => e.id === event.id);
    if (evtIndex !== -1) {
      this.events[evtIndex].currentRegistrationCount = (this.events[evtIndex].currentRegistrationCount || 0) + 1;
    }

    this.addNotification({
      userId: user.uid,
      title: 'Registration Successful! 🎯',
      message: `You have successfully registered for "${event.name}".`,
      type: 'SUCCESS',
      linkUrl: `/events/${event.id}`,
    });

    this.save();
    return newRegistration;
  }

  public cancelRegistration(registrationId: string, userId: string): Registration {
    const index = this.registrations.findIndex((r) => r.id === registrationId && r.userId === userId);
    if (index === -1) throw new Error('Registration not found or unauthorized.');

    const reg = this.registrations[index];
    reg.status = 'CANCELLED';
    reg.updatedAt = new Date().toISOString();

    const evtIndex = this.events.findIndex((e) => e.id === reg.eventId);
    if (evtIndex !== -1 && (this.events[evtIndex].currentRegistrationCount || 0) > 0) {
      this.events[evtIndex].currentRegistrationCount = (this.events[evtIndex].currentRegistrationCount || 1) - 1;
    }

    this.addNotification({
      userId,
      title: 'Registration Cancelled',
      message: `Your registration for "${reg.eventTitle}" has been cancelled.`,
      type: 'WARNING',
    });

    this.save();
    return reg;
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter((n) => n.userId === userId || n.userId === 'GLOBAL' || n.isGlobal);
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif_' + Date.now(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(notifId: string) {
    const index = this.notifications.findIndex((n) => n.id === notifId);
    if (index !== -1) {
      this.notifications[index].read = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    this.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'GLOBAL' || n.isGlobal) {
        n.read = true;
      }
    });
    this.save();
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(log: Omit<AuditLog, 'id'>) {
    const newLog: AuditLog = {
      ...log,
      id: 'log_' + Date.now(),
    };
    this.auditLogs.unshift(newLog);
    this.save();
  }
}

export const mockStore = new MockStore();
