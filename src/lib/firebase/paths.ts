import { collection, doc, collectionGroup } from 'firebase/firestore';
import { db } from './config';

export const DEFAULT_TENURE_ID = '2026-2027';
export const DEFAULT_MAIN_EVENT_ID = 'communityDayAug26';

// ---------------------------------------------------------
// Tenure Layer
// ---------------------------------------------------------
export const getTenuresCollectionRef = () => collection(db, 'tenures');
export const getTenureRef = (tenureId: string = DEFAULT_TENURE_ID) => 
  doc(db, 'tenures', tenureId);

// ---------------------------------------------------------
// Main Event Layer
// ---------------------------------------------------------
export const getMainEventsCollectionRef = (tenureId: string = DEFAULT_TENURE_ID) => 
  collection(db, 'tenures', tenureId, 'mainEvents');
export const getMainEventRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID) => 
  doc(db, 'tenures', tenureId, 'mainEvents', mainEventId);

// ---------------------------------------------------------
// Event Layer
// ---------------------------------------------------------
export const getEventsCollectionRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID) => 
  collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events');
export const getEventRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID, eventId: string) => 
  doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId);

// ---------------------------------------------------------
// Sub-Event Layer
// ---------------------------------------------------------
export const getSubEventsCollectionRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID, eventId: string) => 
  collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents');
export const getSubEventRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID, eventId: string, subEventId: string) => 
  doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId);

// ---------------------------------------------------------
// Data Collections (Registrations, Submissions, Winners)
// ---------------------------------------------------------

/**
 * Registrations can technically live under an Event or a Sub-Event. 
 * For legacy events (e.g., Spotlight Showdown), they live under the Event directly.
 * For new nested events, they live under the Sub-Event.
 */
export const getRegistrationsCollectionRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId?: string | null
) => {
  if (subEventId) {
    return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'registrations');
  }
  return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'registrations');
};

export const getRegistrationRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId: string | null | undefined, 
  registrationId: string
) => {
  if (subEventId) {
    return doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'registrations', registrationId);
  }
  return doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'registrations', registrationId);
};

export const getSubmissionsCollectionRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId?: string | null
) => {
  if (subEventId) {
    return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'submissions');
  }
  return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'submissions');
};

export const getWinnersCollectionRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId?: string | null
) => {
  if (subEventId) {
    return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'winners');
  }
  return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'winners');
};

// ---------------------------------------------------------
// Cross-Hierarchy Queries (Collection Groups)
// ---------------------------------------------------------

/**
 * Used for querying across all instances regardless of hierarchy path.
 */
export const getAllEventsGroupRef = () => collectionGroup(db, 'events');
export const getAllSubEventsGroupRef = () => collectionGroup(db, 'subEvents');
export const getAllRegistrationsGroupRef = () => collectionGroup(db, 'registrations');
export const getAllSubmissionsGroupRef = () => collectionGroup(db, 'submissions');
export const getAllWinnersGroupRef = () => collectionGroup(db, 'winners');
