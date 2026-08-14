export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  name: string; // Normalized name
  phone: string;
  region: string;
  level: string;
  programme: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  avatarUrl?: string;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED';
export type RegistrationType = 'INDIVIDUAL' | 'TEAM';

export interface EventItem {
  id: string;
  name: string;
  description: string;
  category: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  registrationDeadline: string; // ISO string
  venue: string;
  registrationType: RegistrationType;
  maximumParticipants: number | null;
  maximumTeamSize: number | null;
  rulebookUrl: string | null;
  coverImageUrl: string | null;
  status: EventStatus;
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
  currentRegistrationCount?: number;
}

export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';

export interface Registration {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  nameSnapshot: string;
  emailSnapshot: string;
  phoneSnapshot: string;
  regionSnapshot: string;
  levelSnapshot: string;
  programmeSnapshot: string;
  registrationType: RegistrationType;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AllowedUser {
  email: string;
  importBatchId: string;
  importedAt: string;
}

export interface AllowedUserImportBatch {
  id: string;
  importedBy: string;
  importedByEmail: string;
  importedAt: string;
  totalValidEmails: number;
  replacedPreviousCount: number;
  filename: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // Target user or 'GLOBAL'
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'EVENT' | 'ROLE_CHANGE';
  linkUrl?: string;
  read: boolean;
  createdAt: string;
  isGlobal?: boolean;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  target: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SpreadsheetRow {
  email: string;
  isValid: boolean;
  errorReason?: string;
}

export interface SpreadsheetParseResult {
  validRows: string[];
  invalidRows: { row: number; email: string; reason: string }[];
  duplicateCount: number;
  totalParsed: number;
}
