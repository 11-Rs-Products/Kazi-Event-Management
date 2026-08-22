'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Registration, MainEvent, EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, updateDoc, doc, collectionGroup, increment } from 'firebase/firestore';
import { getAllRegistrationsGroupRef, getAllEventsGroupRef, getRegistrationRef, getMainEventsCollectionRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TeamStatusPanel } from '@/components/events/TeamStatusPanel';
import { EventCard } from '@/components/events/EventCard';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { SubmissionModal } from '@/components/events/SubmissionModal';
import { formatDate } from '@/lib/utils/formatDate';
import { Ticket, Calendar, MapPin, XCircle, ArrowRight, ShieldCheck, Bookmark, ChevronDown, ChevronRight, UploadCloud, ExternalLink, CheckCircle2, AlertTriangle, FileText, Layers, Users, Edit3 } from 'lucide-react';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventItem>>({});
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Submission Modal state
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [activeRegForSubmission, setActiveRegForSubmission] = useState<Registration | null>(null);
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<string, string>>({});
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Cancellation Modal state
  const [cancelRegId, setCancelRegId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit Registration state
  const [activeRegForEdit, setActiveRegForEdit] = useState<Registration | null>(null);

  const toggleGroup = (groupId: string) => {
    setActiveGroupId(prev => prev === groupId ? null : groupId);
  };

  const fetchMyRegs = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      const userRegs = mockStore.getRegistrationsForUser(user.uid);
      const mockEvents = mockStore.getEvents();
      const map: Record<string, EventItem> = {};
      mockEvents.forEach(e => { map[e.id] = e; });
      setEventsMap(map);
      setRegistrations(userRegs);
      setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
      setLoading(false);
    } else {
      try {
        const q = query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const items: Registration[] = [];
        snap.forEach((doc) => {
          if (doc.ref.path.includes('tenures/')) {
            const data = doc.data();
            items.push({ 
              id: doc.id, 
              ...data,
              nameSnapshot: data.nameSnapshot || data.name || '',
              emailSnapshot: data.emailSnapshot || data.email || '',
              phoneSnapshot: data.phoneSnapshot || data.phone || '',
              regionSnapshot: data.regionSnapshot || data.region || '',
              levelSnapshot: data.levelSnapshot || data.level || '',
              programmeSnapshot: data.programmeSnapshot || data.programme || ''
            } as Registration);
          }
        });

        // Fetch events to get submission metadata
        const eventsSnap = await getDocs(getAllEventsGroupRef());
        const eMap: Record<string, EventItem> = {};
        eventsSnap.forEach((doc) => {
          eMap[doc.id] = { id: doc.id, ...doc.data() } as EventItem;
        });
        setEventsMap(eMap);

        const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
        const mainList: MainEvent[] = [];
        mainSnap.forEach((d) => mainList.push({ id: d.id, ...d.data() } as MainEvent));

        setRegistrations(items);
        setMainEvents(mainList);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMyRegs();
  }, [user]);

  const openSubmissionModal = (reg: Registration) => {
    setActiveRegForSubmission(reg);
    if (reg.submissionAnswers) {
      setSubmissionAnswers(reg.submissionAnswers);
    } else if (reg.submissionContent) {
      setSubmissionAnswers({ legacy: reg.submissionContent });
    } else {
      setSubmissionAnswers({});
    }
    setSubmissionError(null);
    setIsSubmissionModalOpen(true);
  };

  const handleCancelRegistration = (registrationId: string) => {
    setCancelRegId(registrationId);
  };

  const executeCancelRegistration = async () => {
    if (!user || !cancelRegId) return;

    setIsCancelling(true);
    if (isMockMode) {
      mockStore.cancelRegistration(cancelRegId, user.uid);
      setIsCancelling(false);
      setCancelRegId(null);
      fetchMyRegs();
    } else {
      try {
        const reg = registrations.find(r => r.id === cancelRegId);
        if (!reg) throw new Error("Registration not found in state");
        const tenure = reg.tenureId || DEFAULT_TENURE_ID;
        const mainEvent = reg.mainEventId || 'communityDayAug26';

        const docRef = getRegistrationRef(tenure, mainEvent, reg.eventId, reg.subEventId, cancelRegId);
        await updateDoc(docRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
        
        // Decrement the event's registration count
        const eventRef = getEventRef(tenure, mainEvent, reg.eventId);
        await updateDoc(eventRef, { currentRegistrationCount: increment(-1) });
        
        setIsCancelling(false);
        setCancelRegId(null);
        fetchMyRegs();
      } catch (err) {
        console.error('Cancel registration error:', err);
        setIsCancelling(false);
        setCancelRegId(null);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-900 dark:text-cream-100 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
          <span>My Event Registrations</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/70 mt-1">
          View your confirmed event registrations, participation history, and status.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/60">
          Loading your registrations...
        </div>
      ) : registrations.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-kaziranga-400 dark:text-cream-400/40 mx-auto" />
          <div>
            <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">
              No Event Registrations Found
            </h3>
            <p className="text-xs text-kaziranga-600 dark:text-cream-400/70 max-w-sm mx-auto mt-1">
              You have not registered for any Kaziranga House events yet. Explore open competitions to get started!
            </p>
          </div>
          <Link href="/events" className="inline-block">
            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Events
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          {mainEvents
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((mainEvent) => {
            const regs = registrations.filter(r => r.mainEventId === mainEvent.id && r.status !== 'CANCELLED');
            if (regs.length === 0) return null;
            const isCollapsed = activeGroupId !== mainEvent.id;

            return (
              <div key={mainEvent.id} className="space-y-4">
                <button 
                  onClick={() => toggleGroup(mainEvent.id)}
                  className="w-full flex items-center justify-between group border-b border-cream-400/30 dark:border-kaziranga-800 pb-2 hover:bg-cream-200/40 dark:hover:bg-kaziranga-900/40 rounded-lg px-2 transition-colors"
                >
                  <h2 className="text-lg font-black font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-kaziranga-500 dark:text-kaziranga-400" />
                    {mainEvent.name}
                  </h2>
                  <div className="text-kaziranga-400 dark:text-cream-400/60 group-hover:text-kaziranga-600 dark:group-hover:text-cream-200">
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                
                {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regs.map((reg) => {
                    const isConfirmed = reg.status === 'CONFIRMED';
                    const event = eventsMap[reg.eventId];

                    if (!event) {
                      return (
                        <Card key={reg.id} className="p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">
                                {reg.eventTitle || 'Event'}
                              </h3>
                              <p className="text-xs text-kaziranga-500 dark:text-cream-400/60 mt-0.5">
                                Registration ID: <span className="font-mono">{reg.id}</span>
                              </p>
                            </div>
                            <Badge variant={isConfirmed ? 'emerald' : 'rose'} size="md">
                              {reg.status}
                            </Badge>
                          </div>
                        </Card>
                      );
                    }

                    return (
                      <EventCard key={reg.id} event={event} isRegistered={isConfirmed}>
                        <div className="space-y-4 mt-2">
                          {/* Cancelled Status Alert */}
                          {!isConfirmed && (
                            <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Registration Status</span>
                              <Badge variant="rose" size="md">{reg.status}</Badge>
                            </div>
                          )}

                          {/* Team Status Section */}
                          {(reg.teamId || reg.teamRole) && (
                            <TeamStatusPanel registration={reg} event={event} />
                          )}

                          {/* Submission Deliverable Section */}
                          {(() => {
                            const hasDeliverableRequirement = event?.requireSubmission || !!reg.submissionContent;
                            if (!hasDeliverableRequirement) return null;

                            const isSubmitted = !!reg.submissionContent;
                            const isUrl = isSubmitted && (reg.submissionContent?.startsWith('http://') || reg.submissionContent?.startsWith('https://'));

                            return (
                              <div className="p-3 rounded-xl bg-cream-100/70 dark:bg-kaziranga-800/50 border border-cream-400/30 dark:border-kaziranga-700/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-1.5">
                                    <UploadCloud className="w-4 h-4 text-kaziranga-600 dark:text-gold-400" />
                                    <span>Project Deliverable</span>
                                  </div>
                                  <Badge variant={isSubmitted ? 'emerald' : 'gold'} size="sm">
                                    {isSubmitted ? 'Submitted' : 'Submission Required'}
                                  </Badge>
                                </div>

                                {isSubmitted ? (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="text-xs text-kaziranga-700 dark:text-cream-300">
                                      {isUrl ? (
                                        <a
                                          href={reg.submissionContent!}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 font-bold text-kaziranga-800 dark:text-gold-400 hover:underline break-all"
                                        >
                                          <span>{reg.submissionContent}</span>
                                          <ExternalLink className="w-3 h-3 shrink-0" />
                                        </a>
                                      ) : (
                                        <div className="p-2 rounded bg-cream-200/50 dark:bg-kaziranga-900/60 text-xs font-mono whitespace-pre-wrap line-clamp-3">
                                          {reg.submissionContent}
                                        </div>
                                      )}
                                    </div>
                                    {reg.submittedAt && (
                                      <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 pt-1 border-t border-cream-400/20 dark:border-kaziranga-800">
                                        Submitted: {formatDate(reg.submittedAt)}
                                      </div>
                                    )}
                                    {isConfirmed && (
                                      <button
                                        type="button"
                                        onClick={() => openSubmissionModal(reg)}
                                        className="text-[11px] font-bold text-kaziranga-700 dark:text-gold-400 hover:underline inline-block pt-1"
                                      >
                                        Edit / Update Submission →
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2 pt-1">
                                    <p className="text-[11px] text-kaziranga-600 dark:text-cream-400/70 leading-relaxed">
                                      {event?.submissionInstructions || 'Please submit your project or deliverable solution before the deadline.'}
                                    </p>
                                    {isConfirmed && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                                        onClick={() => openSubmissionModal(reg)}
                                        className="w-full sm:w-auto"
                                      >
                                        Submit Deliverable
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Actions */}
                          <div className="pt-2 flex items-center justify-between border-t border-cream-400/20 dark:border-kaziranga-800">
                            <span className="text-[10px] text-kaziranga-400 dark:text-kaziranga-500 font-mono">ID: {reg.id}</span>
                            <div className="flex items-center gap-2">
                              {isConfirmed && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveRegForEdit(reg)}
                                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-kaziranga-600 dark:text-cream-300" />}
                                  >
                                    Edit Registration
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelRegistration(reg.id)}
                                    leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                  >
                                    Cancel Registration
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </EventCard>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}

          {/* Fallback for registrations with missing/invalid mainEventId */}
          {registrations.filter(r => !mainEvents.some(m => m.id === r.mainEventId)).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-2 border-b border-cream-400/30 dark:border-kaziranga-800 pb-2">
                <Bookmark className="w-5 h-5 text-kaziranga-500 dark:text-kaziranga-400" />
                Other Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.filter(r => !mainEvents.some(m => m.id === r.mainEventId) && r.status !== 'CANCELLED').map((reg) => {
                  const isConfirmed = reg.status === 'CONFIRMED';
                  const event = eventsMap[reg.eventId];
                  const hasDeliverableRequirement = event?.requireSubmission || !!reg.submissionContent;
                  const isSubmitted = !!reg.submissionContent;
                  const isUrl = isSubmitted && (reg.submissionContent?.startsWith('http://') || reg.submissionContent?.startsWith('https://'));

                  if (!event) {
                    return (
                      <Card key={reg.id} className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">
                              {reg.eventTitle || 'Event'}
                            </h3>
                            <p className="text-xs text-kaziranga-500 dark:text-cream-400/60 mt-0.5">
                              Registration ID: <span className="font-mono">{reg.id}</span>
                            </p>
                          </div>
                          <Badge variant={isConfirmed ? 'emerald' : 'rose'} size="md">
                            {reg.status}
                          </Badge>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <EventCard key={reg.id} event={event} isRegistered={isConfirmed}>
                      <div className="space-y-4 mt-2">
                        {/* Cancelled Status Alert */}
                        {!isConfirmed && (
                          <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Registration Status</span>
                            <Badge variant="rose" size="md">{reg.status}</Badge>
                          </div>
                        )}

                        {/* Team Status Section */}
                        {(reg.teamId || reg.teamRole) && (
                          <TeamStatusPanel registration={reg} event={event} />
                        )}

                        {hasDeliverableRequirement && (
                          <div className="p-3 rounded-xl bg-cream-100/70 dark:bg-kaziranga-800/50 border border-cream-400/30 dark:border-kaziranga-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-1.5">
                                <UploadCloud className="w-4 h-4 text-kaziranga-600 dark:text-gold-400" />
                                <span>Project Deliverable</span>
                              </div>
                              <Badge variant={isSubmitted ? 'emerald' : 'gold'} size="sm">
                                {isSubmitted ? 'Submitted' : 'Submission Required'}
                              </Badge>
                            </div>

                            {isSubmitted ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-xs text-kaziranga-700 dark:text-cream-300">
                                  {isUrl ? (
                                    <a href={reg.submissionContent!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-kaziranga-800 dark:text-gold-400 hover:underline break-all">
                                      <span>{reg.submissionContent}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <div className="p-2 rounded bg-cream-200/50 dark:bg-kaziranga-900/60 text-xs font-mono whitespace-pre-wrap line-clamp-3">{reg.submissionContent}</div>
                                  )}
                                </div>
                                {reg.submittedAt && (
                                  <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 pt-1 border-t border-cream-400/20 dark:border-kaziranga-800">
                                    Submitted: {formatDate(reg.submittedAt)}
                                  </div>
                                )}
                                {isConfirmed && (
                                  <button type="button" onClick={() => openSubmissionModal(reg)} className="text-[11px] font-bold text-kaziranga-700 dark:text-gold-400 hover:underline inline-block pt-1">
                                    Edit / Update Submission →
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2 pt-1">
                                <p className="text-[11px] text-kaziranga-600 dark:text-cream-400/70 leading-relaxed">
                                  {event?.submissionInstructions || 'Please submit your project or deliverable solution.'}
                                </p>
                                {isConfirmed && (
                                  <Button size="sm" variant="secondary" leftIcon={<UploadCloud className="w-3.5 h-3.5" />} onClick={() => openSubmissionModal(reg)}>
                                    Submit Deliverable
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-cream-400/20 dark:border-kaziranga-800">
                          <span className="text-[10px] text-kaziranga-400 dark:text-kaziranga-500 font-mono">ID: {reg.id}</span>
                          <div className="flex items-center gap-2">
                            {isConfirmed && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveRegForEdit(reg)}
                                  leftIcon={<Edit3 className="w-3.5 h-3.5 text-kaziranga-600 dark:text-cream-300" />}
                                >
                                  Edit Registration
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelRegistration(reg.id)}
                                  leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                >
                                  Cancel Registration
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </EventCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Modal */}
      {isSubmissionModalOpen && activeRegForSubmission && (
        <SubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          event={eventsMap[activeRegForSubmission.eventId]}
          registration={activeRegForSubmission}
          onSuccess={fetchMyRegs}
        />
      )}

      {/* Confirmation Modal for Registration Cancellation */}
      <ConfirmModal
        isOpen={!!cancelRegId}
        onClose={() => setCancelRegId(null)}
        onConfirm={executeCancelRegistration}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration for this event? Your reserved spot will be released immediately, and you can re-register anytime while open seats remain."
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
        variant="danger"
        isLoading={isCancelling}
      />

      {/* Edit Registration Modal */}
      {activeRegForEdit && eventsMap[activeRegForEdit.eventId] && (
        <RegistrationModal
          event={eventsMap[activeRegForEdit.eventId]}
          existingRegistration={activeRegForEdit}
          isOpen={!!activeRegForEdit}
          onClose={() => setActiveRegForEdit(null)}
          onSuccess={() => {
            setActiveRegForEdit(null);
            fetchMyRegs(); // Refresh the data to reflect edits
          }}
        />
      )}
    </div>
  );
}
