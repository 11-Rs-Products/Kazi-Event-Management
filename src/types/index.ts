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
  isAccessRevoked?: boolean;
  revokedAt?: string;
  revokedBy?: string;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED';
export type RegistrationType = 'INDIVIDUAL' | 'TEAM';

export interface EventGroup {
  id: string;
  name: string;
  slug?: string;
  description: string;
  coverImageUrl: string | null;
  status: EventStatus;
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
}

export interface Tenure {
  id: string;
  name: string;
  displayName: string;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface MainEvent {
  id: string;
  tenureId: string;
  name: string;
  title?: string;
  description: string;
  status: EventStatus;
  createdAt: any;
  updatedAt: any;
  migratedAt?: any;
}

export interface EventCustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[]; // Used for radio and checkbox
}

export type SubmissionTiming = 'DURING_REGISTRATION' | 'AFTER_REGISTRATION';
export type SubmissionType = 'LINK' | 'TEXT';

export interface SubmissionRequirement {
  id: string;
  label: string;
  type: SubmissionType;
  timing?: SubmissionTiming;
  deadline?: string | null;
  required?: boolean;
}

export interface EventItem {
  id: string;
  tenureId?: string; // Academic tenure association
  mainEventId?: string; // Parent mega event grouping (optional)
  name: string;
  slug?: string;
  description: string;
  category: string | string[];
  displayOrder?: number;
  startDateTime: string;
  endDateTime: string;
  registrationEndDateTime?: string | null;
  registrationDeadline: string;
  venue: string;
  registrationType: RegistrationType;
  maximumParticipants: number | null;
  minimumTeamSize?: number | null;
  maximumTeamSize: number | null;
  rulebookUrl: string | null;
  coverImageUrl: string | null;
  status: EventStatus;
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
  migratedAt?: any;
  currentRegistrationCount?: number;
  customQuestions?: EventCustomQuestion[];
  requireSubmission?: boolean;
  submissionTiming?: SubmissionTiming | SubmissionTiming[];
  submissionType?: SubmissionType; // Keep for backward compatibility, use submissionRequirements instead
  submissionInstructions?: string;
  duringSubmissionInstructions?: string | null;
  afterSubmissionInstructions?: string | null;
  submissionDeadline?: string | null;
  submissionRequirements?: SubmissionRequirement[];
}

export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';

export interface Registration {
  id: string;
  tenureId?: string;
  mainEventId?: string;
  eventId: string;
  subEventId?: string | null;
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
  migratedAt?: any;
  customAnswers?: Record<string, any>;
  submissionContent?: string | null;
  submissionAnswers?: Record<string, string>;
  submittedAt?: string | null;
}

export interface Submission {
  id: string;
  userId: string;
  tenureId?: string;
  mainEventId?: string;
  eventId: string;
  subEventId?: string | null;
  content: string; // e.g. URL or text
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: any;
  updatedAt: any;
  migratedAt?: any;
}

export interface Winner {
  id: string;
  userId: string;
  tenureId?: string;
  mainEventId?: string;
  eventId: string;
  subEventId?: string | null;
  position: number;
  category?: string;
  submissionId?: string;
  createdAt: any;
  updatedAt: any;
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
  addedCount?: number;
  retainedCount?: number;
  deactivatedCount?: number;
}

export type HistoricalUserCategory = 'FORMER' | 'PAST';

export interface HistoricalUser {
  user: UserProfile;
  category: HistoricalUserCategory;
  eventRegistrationsCount: number;
  registrations: Registration[];
  lastActiveDate: string;
  revokedAt?: string;
}
