import { AllowedUser, AuditLog, EventItem, NotificationItem, Registration, UserProfile, UserRole, Tenure, TeamInvitation } from '@/types';
import { INITIAL_ALLOWED_USERS, INITIAL_AUDIT_LOGS, INITIAL_EVENTS, INITIAL_NOTIFICATIONS, INITIAL_REGISTRATIONS, INITIAL_SUPER_ADMIN_EMAILS, INITIAL_USERS, INITIAL_TENURES } from './mockData';
import { formatRoleName } from '../utils/roleFormatter';

class MockStore {
  private users: UserProfile[];
  private allowedUsers: AllowedUser[];
  private events: EventItem[];
  private registrations: Registration[];
  private notifications: NotificationItem[];
  private auditLogs: AuditLog[];
  private tenures: Tenure[];
  private teamInvitations: TeamInvitation[];
  private activeUser: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedUsers = JSON.parse(localStorage.getItem('kazi_users') || 'null');
      if (storedUsers && Array.isArray(storedUsers)) {
        const existingEmails = new Set(storedUsers.map((u: UserProfile) => u.email.toLowerCase()));
        INITIAL_USERS.forEach((initU) => {
          if (!existingEmails.has(initU.email.toLowerCase())) {
            storedUsers.push(initU);
          }
        });
        this.users = storedUsers;
      } else {
        this.users = [...INITIAL_USERS];
      }

      this.allowedUsers = JSON.parse(localStorage.getItem('kazi_allowed_users') || 'null') || INITIAL_ALLOWED_USERS;
      this.events = JSON.parse(localStorage.getItem('kazi_events') || 'null') || INITIAL_EVENTS;

      const storedRegs = JSON.parse(localStorage.getItem('kazi_registrations') || 'null');
      if (storedRegs && Array.isArray(storedRegs)) {
        const existingRegIds = new Set(storedRegs.map((r: Registration) => r.id));
        INITIAL_REGISTRATIONS.forEach((initR) => {
          if (!existingRegIds.has(initR.id)) {
            storedRegs.push(initR);
          }
        });
        this.registrations = storedRegs;
      } else {
        this.registrations = [...INITIAL_REGISTRATIONS];
      }

      this.notifications = JSON.parse(localStorage.getItem('kazi_notifications') || 'null') || INITIAL_NOTIFICATIONS;
      this.auditLogs = JSON.parse(localStorage.getItem('kazi_audit_logs') || 'null') || INITIAL_AUDIT_LOGS;
      this.tenures = JSON.parse(localStorage.getItem('kazi_tenures') || 'null') || INITIAL_TENURES;
      this.teamInvitations = JSON.parse(localStorage.getItem('kazi_team_invitations') || 'null') || [];

      const savedActiveUser = localStorage.getItem('kazi_active_user');
      if (savedActiveUser) {
        this.activeUser = JSON.parse(savedActiveUser);
      } else {
        this.activeUser = this.users[0];
      }
    } else {
      this.users = [...INITIAL_USERS];
      this.allowedUsers = [...INITIAL_ALLOWED_USERS];
      this.events = [...INITIAL_EVENTS];
      this.registrations = [...INITIAL_REGISTRATIONS];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.tenures = [...INITIAL_TENURES];
      this.teamInvitations = [];
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
      localStorage.setItem('kazi_tenures', JSON.stringify(this.tenures));
      localStorage.setItem('kazi_team_invitations', JSON.stringify(this.teamInvitations));
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
    return [...this.users];
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
        this.activeUser = { ...this.users[index] };
      }
      this.save();
      return this.users[index];
    }
    throw new Error('User not found');
  }

  public updateUserRole(targetUid: string, newRole: UserRole, actorUser: UserProfile): UserProfile {
    const index = this.users.findIndex((u) => u.uid === targetUid);
    if (index === -1) throw new Error('Target user not found');

    const target = this.users[index];
    const oldRole = target.role;
    const updatedUser = {
      ...target,
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
    this.users[index] = updatedUser;

    if (this.activeUser && this.activeUser.uid === targetUid) {
      this.activeUser = { ...updatedUser };
    }

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'ROLE_CHANGED',
      target: `${updatedUser.name} (${updatedUser.email})`,
      timestamp: new Date().toISOString(),
      metadata: { oldRole, newRole },
    });

    const oldRoleDisplayName = formatRoleName(oldRole);
    const newRoleDisplayName = formatRoleName(newRole);

    this.addNotification({
      userId: updatedUser.uid,
      title: 'Role Updated',
      message: `Your account access role has been updated from ${oldRoleDisplayName} to ${newRoleDisplayName}.`,
      type: 'ROLE_CHANGE',
    });

    this.save();
    return updatedUser;
  }

  // Allowed Users
  public getAllowedUsers(): AllowedUser[] {
    return this.allowedUsers;
  }

  public removeAllowedUser(email: string, actorUser: UserProfile): { success: boolean; email: string } {
    const cleanEmail = email.trim().toLowerCase();
    const prevCount = this.allowedUsers.length;
    this.allowedUsers = this.allowedUsers.filter((u) => u.email.trim().toLowerCase() !== cleanEmail);

    const targetUserIdx = this.users.findIndex((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (targetUserIdx !== -1) {
      this.users[targetUserIdx] = {
        ...this.users[targetUserIdx],
        isAccessRevoked: true,
        revokedAt: new Date().toISOString(),
        revokedBy: actorUser.email,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Create user profile record for revoked user so it is tracked in archived list
      const rawName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = rawName.replace(/\b\w/g, (l) => l.toUpperCase());
      const newArchivedUser: UserProfile = {
        uid: 'user_' + Date.now(),
        email: cleanEmail,
        name: formattedName,
        phone: '',
        region: 'Unassigned',
        level: 'Foundation',
        programme: 'BS Degree',
        role: 'USER',
        isAccessRevoked: true,
        revokedAt: new Date().toISOString(),
        revokedBy: actorUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: '',
      };
      this.users.push(newArchivedUser);
    }

    // If revoked user was active user, clear session
    if (this.activeUser && this.activeUser.email.trim().toLowerCase() === cleanEmail) {
      this.activeUser = null;
    }

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'USER_ACCESS_REVOKED',
      target: cleanEmail,
      timestamp: new Date().toISOString(),
      metadata: {
        revokedEmail: cleanEmail,
        previousAllowedCount: prevCount,
        newAllowedCount: this.allowedUsers.length,
      },
    });

    this.save();
    return { success: true, email: cleanEmail };
  }

  public replaceAllowedUsers(
    newEmails: string[],
    actorUser: UserProfile,
    filename: string
  ): {
    total: number;
    batchId: string;
    addedCount: number;
    retainedCount: number;
    deactivatedCount: number;
  } {
    const batchId = 'batch_' + Date.now();
    const importedAt = new Date().toISOString();

    const currentEmailSet = new Set(this.allowedUsers.map((u) => u.email.trim().toLowerCase()));
    const newEmailSet = new Set(newEmails.map((e) => e.trim().toLowerCase()));

    let addedCount = 0;
    let retainedCount = 0;
    let deactivatedCount = 0;

    newEmailSet.forEach((email) => {
      if (currentEmailSet.has(email)) {
        retainedCount++;
      } else {
        addedCount++;
      }
    });

    currentEmailSet.forEach((email) => {
      if (!newEmailSet.has(email)) {
        deactivatedCount++;
      }
    });

    const previousCount = this.allowedUsers.length;
    this.allowedUsers = Array.from(newEmailSet).map((email) => ({
      email,
      importBatchId: batchId,
      importedAt,
    }));

    // Update isAccessRevoked flag on existing users
    this.users = this.users.map((u) => {
      const cleanEmail = u.email.trim().toLowerCase();
      if (!newEmailSet.has(cleanEmail)) {
        return {
          ...u,
          isAccessRevoked: true,
          revokedAt: importedAt,
          revokedBy: actorUser.email,
          updatedAt: importedAt,
        };
      } else if (u.isAccessRevoked) {
        return {
          ...u,
          isAccessRevoked: false,
          revokedAt: undefined,
          revokedBy: undefined,
          updatedAt: importedAt,
        };
      }
      return u;
    });

    // Ensure all deactivated emails have a user entry
    currentEmailSet.forEach((email) => {
      if (!newEmailSet.has(email)) {
        const exists = this.users.some((u) => u.email.trim().toLowerCase() === email);
        if (!exists) {
          const rawName = email.split('@')[0].replace(/[._]/g, ' ');
          const formattedName = rawName.replace(/\b\w/g, (l) => l.toUpperCase());
          this.users.push({
            uid: 'user_' + Math.random().toString(36).substr(2, 9),
            email,
            name: formattedName,
            phone: '',
            region: 'Unassigned',
            level: 'Foundation',
            programme: 'BS Degree',
            role: 'USER',
            isAccessRevoked: true,
            revokedAt: importedAt,
            revokedBy: actorUser.email,
            createdAt: importedAt,
            updatedAt: importedAt,
            lastLoginAt: '',
          });
        }
      }
    });

    // Check if active user is still allowed
    if (this.activeUser && !this.isEmailAllowed(this.activeUser.email)) {
      this.activeUser = null;
    }

    // Automatically send in-app notification to all active Admins
    const activeAdmins = this.users.filter(
      (u) =>
        (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') &&
        this.isEmailAllowed(u.email)
    );

    activeAdmins.forEach((admin) => {
      this.addNotification({
        userId: admin.uid,
        title: 'Allowed User List Updated',
        message: `The latest allowed-user list (${filename}) has been uploaded and is now active. (${newEmails.length} active users, +${addedCount} added, -${deactivatedCount} deactivated).`,
        type: 'INFO',
        linkUrl: '/super-admin/allowed-users',
      });
    });

    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'ALLOWED_USERS_SYNCHRONIZED',
      target: 'allowedUsers Collection',
      timestamp: importedAt,
      metadata: {
        totalValidEmails: newEmails.length,
        replacedPreviousCount: previousCount,
        addedCount,
        retainedCount,
        deactivatedCount,
        filename,
        batchId,
      },
    });

    this.save();
    return {
      total: newEmails.length,
      batchId,
      addedCount,
      retainedCount,
      deactivatedCount,
    };
  }

  public getHistoricalUsers(): {
    formerUsers: { user: UserProfile; eventRegistrationsCount: number; registrations: Registration[] }[];
    pastUsers: { user: UserProfile; eventRegistrationsCount: number; registrations: Registration[] }[];
  } {
    const allowedEmailSet = new Set(this.allowedUsers.map((u) => u.email.trim().toLowerCase()));
    
    // Users in database who are NOT in current allowed list
    const historicalList = this.users.filter(
      (u) => !allowedEmailSet.has(u.email.trim().toLowerCase())
    );

    const formerUsers: { user: UserProfile; eventRegistrationsCount: number; registrations: Registration[] }[] = [];
    const pastUsers: { user: UserProfile; eventRegistrationsCount: number; registrations: Registration[] }[] = [];

    historicalList.forEach((user) => {
      const userRegs = this.registrations.filter(
        (r) => r.userId === user.uid || r.emailSnapshot?.trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (userRegs.length === 0) {
        formerUsers.push({
          user,
          eventRegistrationsCount: 0,
          registrations: [],
        });
      } else {
        pastUsers.push({
          user,
          eventRegistrationsCount: userRegs.length,
          registrations: userRegs,
        });
      }
    });

    return { formerUsers, pastUsers };
  }

  // Events
  public getEvents(): EventItem[] {
    return [...this.events];
  }

  public getMainEvents(): any[] {
    return [
      {
        id: 'communityDayAug26',
        name: 'Community Day',
        tenureId: '2026-2027',
        description: 'Annual Community Day Events',
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
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
        title: 'New Event Published',
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
        title: 'Event Published',
        message: `${updated.name} has been published and is open for registration.`,
        type: 'EVENT',
        linkUrl: `/events/${updated.id}`,
        isGlobal: true,
      });
    }

    this.save();
    return updated;
  }

  public deleteEvent(id: string, actorUser: UserProfile): void {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');
    
    const eventName = this.events[index].name;
    this.events.splice(index, 1);
    
    this.addAuditLog({
      actorUserId: actorUser.uid,
      actorEmail: actorUser.email,
      action: 'EVENT_DELETED',
      target: eventName,
      timestamp: new Date().toISOString(),
      metadata: { eventId: id },
    });
    
    this.save();
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
    formData: {
      phone: string;
      region: string;
      level: string;
      programme: string;
      customAnswers?: Record<string, any>;
      submissionContent?: string | null;
      submissionAnswers?: Record<string, string>;
      submittedAt?: string | null;
    }
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
      mainEventId: event.mainEventId || 'communityDayAug26',
      tenureId: event.tenureId || '2026-2027',
      eventTitle: event.name,
      userId: user.uid,
      nameSnapshot: user.name,
      emailSnapshot: user.email,
      phoneSnapshot: formData.phone,
      regionSnapshot: formData.region,
      levelSnapshot: formData.level,
      programmeSnapshot: formData.programme,
      customAnswers: formData.customAnswers,
      submissionContent: formData.submissionContent || null,
      submissionAnswers: formData.submissionAnswers,
      submittedAt: formData.submittedAt || (formData.submissionContent ? new Date().toISOString() : null),
      registrationType: event.registrationType,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.registrations.unshift(newRegistration);

    // Increment count on event (immutable update for React state)
    const evtIndex = this.events.findIndex((e) => e.id === event.id);
    if (evtIndex !== -1) {
      this.events[evtIndex] = {
        ...this.events[evtIndex],
        currentRegistrationCount: (this.events[evtIndex].currentRegistrationCount || 0) + 1
      };
    }

    this.addNotification({
      userId: user.uid,
      title: 'Registration Successful',
      message: `You have successfully registered for "${event.name}".`,
      type: 'SUCCESS',
      linkUrl: `/events/${event.id}`,
    });

    this.save();
    return newRegistration;
  }

  public updateRegistration(
    registrationId: string,
    userId: string,
    formData: {
      phone?: string;
      region?: string;
      level?: string;
      programme?: string;
      customAnswers?: Record<string, any>;
      submissionContent?: string | null;
      submissionAnswers?: Record<string, string>;
      submittedAt?: string | null;
    }
  ): Registration {
    const index = this.registrations.findIndex((r) => r.id === registrationId && r.userId === userId);
    if (index === -1) throw new Error('Registration not found or unauthorized.');

    const old = this.registrations[index];
    const reg: Registration = {
      ...old,
      phoneSnapshot: formData.phone !== undefined ? formData.phone : old.phoneSnapshot,
      regionSnapshot: formData.region !== undefined ? formData.region : old.regionSnapshot,
      levelSnapshot: formData.level !== undefined ? formData.level : old.levelSnapshot,
      programmeSnapshot: formData.programme !== undefined ? formData.programme : old.programmeSnapshot,
      customAnswers: formData.customAnswers !== undefined ? formData.customAnswers : old.customAnswers,
      submissionContent: formData.submissionContent !== undefined ? formData.submissionContent : old.submissionContent,
      submissionAnswers: formData.submissionAnswers !== undefined ? formData.submissionAnswers : old.submissionAnswers,
      submittedAt: formData.submittedAt !== undefined ? formData.submittedAt : old.submittedAt,
      updatedAt: new Date().toISOString()
    };
    
    this.registrations[index] = reg;
    this.save();
    return reg;
  }

  public cancelRegistration(registrationId: string, userId: string): Registration {
    const index = this.registrations.findIndex((r) => r.id === registrationId && r.userId === userId);
    if (index === -1) throw new Error('Registration not found or unauthorized.');

    const reg = {
      ...this.registrations[index],
      status: 'CANCELLED' as const,
      updatedAt: new Date().toISOString()
    };
    this.registrations[index] = reg;

    const evtIndex = this.events.findIndex((e) => e.id === reg.eventId);
    if (evtIndex !== -1 && (this.events[evtIndex].currentRegistrationCount || 0) > 0) {
      this.events[evtIndex] = {
        ...this.events[evtIndex],
        currentRegistrationCount: (this.events[evtIndex].currentRegistrationCount || 1) - 1
      };
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
    const user = this.getUserById(userId);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    return this.notifications.filter(
      (n) => n.userId === userId || (user?.email && n.userId === user.email) || n.userId === 'GLOBAL' || n.isGlobal || (isSuperAdmin && n.userId === 'SUPER_ADMIN')
    );
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

  // Tenures Management
  public getTenures(): Tenure[] {
    return [...this.tenures];
  }

  public getActiveTenure(): Tenure {
    return this.tenures.find(t => t.active) || this.tenures[0] || INITIAL_TENURES[0];
  }

  public createTenure(newTenure: { id: string; name?: string; displayName: string; active?: boolean }, actorUser?: UserProfile | null): Tenure {
    const exists = this.tenures.find(t => t.id === newTenure.id);
    if (exists) {
      throw new Error(`Tenure with ID "${newTenure.id}" already exists.`);
    }

    if (newTenure.active) {
      // Deactivate all others
      this.tenures = this.tenures.map(t => ({ ...t, active: false }));
    }

    const tenure: Tenure = {
      id: newTenure.id,
      name: newTenure.name || newTenure.id,
      displayName: newTenure.displayName,
      active: !!newTenure.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tenures.unshift(tenure);

    if (actorUser) {
      this.addAuditLog({
        actorUserId: actorUser.uid,
        actorEmail: actorUser.email,
        action: 'ALLOWED_USERS_IMPORTED',
        target: `Tenure (${tenure.id})`,
        timestamp: new Date().toISOString(),
        metadata: { displayName: tenure.displayName, active: tenure.active }
      });
    }

    this.save();
    return tenure;
  }

  public setActiveTenure(tenureId: string, actorUser?: UserProfile | null): void {
    const target = this.tenures.find(t => t.id === tenureId);
    if (!target) {
      throw new Error(`Tenure with ID "${tenureId}" not found.`);
    }

    this.tenures = this.tenures.map(t => ({
      ...t,
      active: t.id === tenureId,
      updatedAt: t.id === tenureId ? new Date().toISOString() : t.updatedAt,
    }));

    if (actorUser) {
      this.addAuditLog({
        actorUserId: actorUser.uid,
        actorEmail: actorUser.email,
        action: 'USER_ROLE_CHANGED',
        target: `Active Tenure -> ${target.id}`,
        timestamp: new Date().toISOString(),
        metadata: { activeTenureId: tenureId, displayName: target.displayName }
      });
    }

    this.save();
  }

  // Team Invitations
  public getTeamInvitationsForUser(email: string): TeamInvitation[] {
    const clean = email.trim().toLowerCase();
    return this.teamInvitations.filter(i => i.inviteeEmail.toLowerCase() === clean);
  }

  public getTeamInvitationsForTeam(teamId: string): TeamInvitation[] {
    return this.teamInvitations.filter(i => i.teamRegistrationId === teamId);
  }

  public getTeamInvitationById(invitationId: string): TeamInvitation | undefined {
    return this.teamInvitations.find(i => i.id === invitationId);
  }

  public createTeamInvitation(
    inviterUser: UserProfile,
    event: EventItem,
    teamRegistrationId: string,
    inviteeEmail: string
  ): { invitation?: TeamInvitation; error?: string } {
    const cleanEmail = inviteeEmail.trim().toLowerCase();

    // Validate: no self-invite
    if (cleanEmail === inviterUser.email.toLowerCase()) {
      return { error: 'You cannot invite yourself.' };
    }

    // (Removed allowedUsers check to allow testing with arbitrary emails)

    // Validate: duplicate invitation
    const existing = this.teamInvitations.find(
      i => i.eventId === event.id && i.inviteeEmail.toLowerCase() === cleanEmail
        && i.teamRegistrationId === teamRegistrationId
        && (i.status === 'PENDING' || i.status === 'ACCEPTED')
    );
    if (existing) {
      return { error: `${cleanEmail} has already been invited to this team.` };
    }

    // Validate: already registered
    const existingReg = this.registrations.find(
      r => r.eventId === event.id && r.emailSnapshot.toLowerCase() === cleanEmail && r.status === 'CONFIRMED'
    );
    if (existingReg) {
      return { error: `${cleanEmail} is already registered for this event.` };
    }

    const inviteeUser = this.getUserByEmail(cleanEmail);

    const invitation: TeamInvitation = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      teamRegistrationId,
      eventId: event.id,
      mainEventId: event.mainEventId || 'communityDayAug26',
      tenureId: event.tenureId || '2026-2027',
      inviterUserId: inviterUser.uid,
      inviterName: inviterUser.name,
      inviterEmail: inviterUser.email,
      inviteeEmail: cleanEmail,
      ...(inviteeUser && { inviteeUserId: inviteeUser.uid }),
      status: 'PENDING',
      eventName: event.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.teamInvitations.unshift(invitation);

    // Send notification
    this.addNotification({
      userId: inviteeUser ? inviteeUser.uid : cleanEmail,
      title: `Team Invitation: ${event.name}`,
      message: `${inviterUser.name} has invited you to join their team for "${event.name}". Open to accept or decline.`,
      type: 'TEAM_INVITE',
      linkUrl: `/team-invitation/${invitation.id}`,
      teamInvitationId: invitation.id,
    });

    this.save();
    return { invitation };
  }

  public acceptTeamInvitation(invitationId: string, userId: string): TeamInvitation {
    const index = this.teamInvitations.findIndex(i => i.id === invitationId);
    if (index === -1) throw new Error('Invitation not found.');
    const inv = this.teamInvitations[index];
    if (inv.status !== 'PENDING') throw new Error(`Invitation is already ${inv.status.toLowerCase()}.`);

    this.teamInvitations[index] = {
      ...inv,
      status: 'ACCEPTED',
      inviteeUserId: userId,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    return this.teamInvitations[index];
  }

  public rejectTeamInvitation(invitationId: string, userId: string): TeamInvitation {
    const index = this.teamInvitations.findIndex(i => i.id === invitationId);
    if (index === -1) throw new Error('Invitation not found.');
    const inv = this.teamInvitations[index];
    if (inv.status !== 'PENDING') throw new Error(`Invitation is already ${inv.status.toLowerCase()}.`);

    this.teamInvitations[index] = {
      ...inv,
      status: 'REJECTED',
      inviteeUserId: userId,
      updatedAt: new Date().toISOString(),
    };

    // Notify the initiator
    this.addNotification({
      userId: inv.inviterUserId,
      title: 'Team Invitation Declined',
      message: `${inv.inviteeEmail} has declined your team invitation for "${inv.eventName}".`,
      type: 'WARNING',
    });

    this.save();
    return this.teamInvitations[index];
  }

  public getTeamMembers(teamId: string): Registration[] {
    return this.registrations.filter(r => r.teamId === teamId && r.status === 'CONFIRMED');
  }
}

export const mockStore = new MockStore();
