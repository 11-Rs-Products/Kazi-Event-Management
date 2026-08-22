'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EventItem, Registration } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { registrationSchema } from '@/lib/validation/schemas';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { CheckCircle2, Lock, User, Phone, MapPin, GraduationCap, BookOpen, AlertCircle, Users, Plus, X, Mail, UserPlus, Loader2, Info, ArrowLeft } from 'lucide-react';
import { setDoc, updateDoc, increment, doc, getDoc } from 'firebase/firestore';
import { getRegistrationRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { TeamStatusPanel } from './TeamStatusPanel';
import { formatDate } from '@/lib/utils/formatDate';

interface RegistrationModalProps {
  event: EventItem | null;
  existingRegistration?: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Team join mode props
  joinTeamId?: string;
  joinInvitationId?: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  existingRegistration,
  isOpen,
  onClose,
  onSuccess,
  joinTeamId,
  joinInvitationId,
}) => {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState('');
  const [programme, setProgramme] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Team state
  const [teamName, setTeamName] = useState('');
  const [teammateInput, setTeammateInput] = useState('');
  const [teammateEmails, setTeammateEmails] = useState<string[]>([]);
  const [teammateError, setTeammateError] = useState<string | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [inviteResults, setInviteResults] = useState<{ created: string[]; errors: string[] } | null>(null);

  const isTeamEvent = event?.registrationType === 'TEAM';
  const isJoiningTeam = !!(joinTeamId && joinInvitationId);
  const isInitiator = isTeamEvent && !isJoiningTeam && !existingRegistration;
  const isEditModeInitiator = isTeamEvent && existingRegistration && existingRegistration.teamRole === 'INITIATOR';
  const maxTeamSize = event?.maximumTeamSize || 4;

  const duringSubmissionReqs = useMemo(() => {
    return (event?.submissionRequirements || []).filter(
      (r) => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION'
    );
  }, [event]);

  const afterSubmissionReqs = useMemo(() => {
    return (event?.submissionRequirements || []).filter(
      (r) => r.timing === 'AFTER_REGISTRATION'
    );
  }, [event]);

  const hasDuringSubmissions = useMemo(() => {
    if (!event?.requireSubmission) return false;
    const isDuring = Array.isArray(event.submissionTiming)
      ? event.submissionTiming.includes('DURING_REGISTRATION')
      : event.submissionTiming === 'DURING_REGISTRATION';
    return isDuring && duringSubmissionReqs.length > 0;
  }, [event, duringSubmissionReqs]);

  const hasAfterSubmissions = useMemo(() => {
    if (!event?.requireSubmission) return false;
    const isAfter = Array.isArray(event.submissionTiming)
      ? event.submissionTiming.includes('AFTER_REGISTRATION')
      : event.submissionTiming === 'AFTER_REGISTRATION';
    return isAfter && afterSubmissionReqs.length > 0;
  }, [event, afterSubmissionReqs]);

  const isProfileModified = useMemo(() => {
    if (!user) return false;

    const normalizePhone = (p?: string) => {
      if (!p) return '';
      const digits = p.replace(/\D/g, '');
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const normalizeText = (t?: string) => (t || '').trim().toLowerCase();

    const userPhone = normalizePhone(user.phone);
    const formPhone = normalizePhone(phone);

    const userRegion = normalizeText(user.region);
    const formRegion = normalizeText(region);

    const userLevel = normalizeText(user.level);
    const formLevel = normalizeText(level);

    const userProgramme = normalizeText(user.programme);
    const formProgramme = normalizeText(programme);

    return (
      formPhone !== userPhone ||
      formRegion !== userRegion ||
      formLevel !== userLevel ||
      formProgramme !== userProgramme
    );
  }, [user, phone, region, level, programme]);

  const availableRegions = useMemo(() => {
    const defaultList = [
      'Bengaluru',
      'Chandigarh',
      'Chennai',
      'Delhi',
      'Hyderabad',
      'Kolkata',
      'Lucknow',
      'Mumbai',
      'Patna',
    ];
    const list = [...defaultList];
    if (user?.region && !list.includes(user.region)) list.push(user.region);
    if (existingRegistration?.regionSnapshot && !list.includes(existingRegistration.regionSnapshot)) {
      list.push(existingRegistration.regionSnapshot);
    }
    if (region && !list.includes(region)) list.push(region);
    return Array.from(new Set(list));
  }, [user?.region, existingRegistration?.regionSnapshot, region]);

  const availableLevels = useMemo(() => {
    const defaultList = ['Foundation', 'Diploma', 'Degree'];
    const list = [...defaultList];
    if (user?.level && !list.includes(user.level)) list.push(user.level);
    if (existingRegistration?.levelSnapshot && !list.includes(existingRegistration.levelSnapshot)) {
      list.push(existingRegistration.levelSnapshot);
    }
    if (level && !list.includes(level)) list.push(level);
    return Array.from(new Set(list));
  }, [user?.level, existingRegistration?.levelSnapshot, level]);

  const availableProgrammes = useMemo(() => {
    const defaultList = [
      'Data Science & Applications',
      'Diploma in Programming',
      'Diploma in Data Science',
      'Electronic Systems',
      'Management and Data Science',
      'Aeronautics and Space Technology',
    ];
    const list = [...defaultList];
    if (user?.programme && !list.includes(user.programme)) list.push(user.programme);
    if (existingRegistration?.programmeSnapshot && !list.includes(existingRegistration.programmeSnapshot)) {
      list.push(existingRegistration.programmeSnapshot);
    }
    if (programme && !list.includes(programme)) list.push(programme);
    return Array.from(new Set(list));
  }, [user?.programme, existingRegistration?.programmeSnapshot, programme]);

  useEffect(() => {
    if (existingRegistration) {
      setPhone(existingRegistration.phoneSnapshot || user?.phone || '');
      setRegion(existingRegistration.regionSnapshot || user?.region || '');
      setLevel(existingRegistration.levelSnapshot || user?.level || '');
      setProgramme(existingRegistration.programmeSnapshot || user?.programme || '');
      if (existingRegistration.customAnswers) {
        setCustomAnswers(existingRegistration.customAnswers);
      }
      if (existingRegistration.submissionAnswers) {
        setSubmissionAnswers(existingRegistration.submissionAnswers);
      } else if (existingRegistration.submissionContent) {
        setSubmissionAnswers({ legacy: existingRegistration.submissionContent });
      }
    } else if (user) {
      setPhone(user.phone || '');
      setRegion(user.region || '');
      setLevel(user.level || '');
      setProgramme(user.programme || '');
      setSubmissionAnswers({});
    }
    // Reset team state when modal opens
    if (existingRegistration?.teamName) {
      setTeamName(existingRegistration.teamName);
    } else {
      setTeamName('');
    }
    setTeammateEmails([]);
    setTeammateInput('');
    setTeammateError(null);
    setInviteResults(null);
    setIsReviewing(false);
    setError(null);
  }, [user, existingRegistration, isOpen]);

  if (!event || !user) return null;

  const handleAddTeammate = async () => {
    const email = teammateInput.trim().toLowerCase();
    if (!email) return;

    // Check if valid email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setTeammateError('Please enter a valid email address.');
      return;
    }

    if (email === user?.email?.toLowerCase()) {
      setTeammateError('You cannot invite yourself.');
      return;
    }

    if (teammateEmails.includes(email)) {
      setTeammateError('This email has already been added.');
      return;
    }

    // Max team size check (initiator counts as 1 member)
    if (teammateEmails.length >= maxTeamSize - 1) {
      setTeammateError(`Maximum team size is ${maxTeamSize} (including you).`);
      return;
    }

    // Instant validation against allowed users
    setIsVerifyingEmail(true);
    setTeammateError(null);
    try {
      let isAllowed = false;
      if (isMockMode) {
        isAllowed = mockStore.isEmailAllowed(email);
      } else {
        const allowedDocRef = doc(db, 'allowedUsers', email);
        const allowedSnap = await getDoc(allowedDocRef);
        isAllowed = allowedSnap.exists();
      }

      if (!isAllowed) {
        setTeammateError('Either it is an invalid email or it is not an email associated with Kaziranga.');
        setIsVerifyingEmail(false);
        return;
      }

      setTeammateEmails([...teammateEmails, email]);
      setTeammateInput('');
    } catch (err) {
      console.error('Error verifying teammate email:', err);
      setTeammateError('Error verifying email. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleRemoveTeammate = (email: string) => {
    setTeammateEmails(teammateEmails.filter(e => e !== email));
    setTeammateError(null);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      setError('A valid 10-digit WhatsApp number is required.');
      return;
    }

    if (!region.trim()) {
      setError('Please select your region.');
      return;
    }
    if (!level.trim()) {
      setError('Please select your academic level.');
      return;
    }
    if (!programme.trim()) {
      setError('Please select your programme.');
      return;
    }

    if (isInitiator && teammateEmails.length > 0) {
      if (!teamName.trim()) {
        setError('Team Name is required when registering as a team.');
        return;
      }
      if (teamName.trim().length < 2) {
        setError('Team Name must be at least 2 characters.');
        return;
      }
    }

    // Validate custom questions
    if (event.customQuestions) {
      for (const q of event.customQuestions) {
        const answer = customAnswers[q.id];
        if (q.required) {
          if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            setError(`Please answer the required question: "${q.question}"`);
            return;
          }
        }
      }
    }

    // Validate during-registration submissions
    if (hasDuringSubmissions) {
      for (const req of duringSubmissionReqs) {
        if (req.required !== false) {
          const val = (submissionAnswers[req.id] || '').trim();
          if (!val) {
            setError(`Please provide your submission for: ${req.label}`);
            return;
          }
        }
      }
    }

    setIsReviewing(true);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    setInviteResults(null);

    try {
      if (isInitiator && teammateEmails.length > 0) {
        if (!teamName.trim()) {
          setError('Team Name is required when registering as a team.');
          setLoading(false);
          return;
        }
        if (teamName.trim().length < 2) {
          setError('Team Name must be at least 2 characters.');
          setLoading(false);
          return;
        }
      }

      // Validate inputs
      const validated = registrationSchema.parse({
        eventId: event.id,
        phone,
        region,
        level,
        programme,
        submissionAnswers,
        ...(isJoiningTeam && { teamId: joinTeamId, teamRole: 'MEMBER', teamInvitationId: joinInvitationId }),
        ...(isInitiator && teammateEmails.length > 0 && { teammateEmails, teamName: teamName.trim() }),
      });

      // Validate custom questions
      if (event.customQuestions) {
        for (const q of event.customQuestions) {
          const answer = customAnswers[q.id];
          if (q.required) {
            if (!answer || (Array.isArray(answer) && answer.length === 0)) {
              setError(`Please answer the required question: "${q.question}"`);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Validate submission if required during registration
      const isDuringReg = Array.isArray(event.submissionTiming) 
        ? event.submissionTiming.includes('DURING_REGISTRATION')
        : event.submissionTiming === 'DURING_REGISTRATION';
      
      if (event.requireSubmission && isDuringReg) {
        const duringReqs = (event.submissionRequirements || []).filter(
          (r) => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION'
        );
        for (const req of duringReqs) {
          const val = submissionAnswers[req.id];
          if (!val || !val.trim()) {
            setError(`Please provide your submission for: ${req.label}`);
            setLoading(false);
            return;
          }
        }
      }

      const finalSubmissionAnswers: Record<string, string> = {};
      let hasSubmission = false;
      Object.entries(submissionAnswers).forEach(([k, v]) => {
        if (v && v.trim()) {
          finalSubmissionAnswers[k] = v.trim();
          hasSubmission = true;
        }
      });
      const submittedAt = hasSubmission ? (existingRegistration?.submittedAt || new Date().toISOString()) : null;

      if (isMockMode) {
        if (existingRegistration) {
          mockStore.updateRegistration(existingRegistration.id, user.uid, {
            phone: validated.phone,
            region: validated.region,
            level: validated.level,
            programme: validated.programme,
            customAnswers,
            submissionAnswers: finalSubmissionAnswers,
            submittedAt,
          });
        } else {
          const reg = mockStore.registerForEvent(event, user, {
            phone: validated.phone,
            region: validated.region,
            level: validated.level,
            programme: validated.programme,
            customAnswers,
            submissionAnswers: finalSubmissionAnswers,
            submittedAt,
          });

          // Handle team: set team fields on the registration
          if (isInitiator) {
            // Mark the initiator's registration with team fields
            mockStore.updateRegistration(reg.id, user.uid, {
              // We abuse the generic update for team fields via direct mutation
            });
            // Directly mutate team fields (mockStore.updateRegistration doesn't handle teamId)
            const allRegs = mockStore.getRegistrationsForUser(user.uid);
            const thisReg = allRegs.find(r => r.id === reg.id);
            if (thisReg) {
              (thisReg as any).teamId = reg.id;
              (thisReg as any).teamRole = 'INITIATOR';
              if (teamName.trim()) (thisReg as any).teamName = teamName.trim();
            }

            // Send invitations
            if (teammateEmails.length > 0) {
              const created: string[] = [];
              const errors: string[] = [];
              for (const email of teammateEmails) {
                const result = mockStore.createTeamInvitation(user, event, reg.id, email);
                if (result.error) {
                  errors.push(`${email}: ${result.error}`);
                } else {
                  created.push(email);
                }
              }
              setInviteResults({ created, errors });
            }
          }

          if (isJoiningTeam) {
            // Mark as team member
            const allRegs = mockStore.getRegistrationsForUser(user.uid);
            const thisReg = allRegs.find(r => r.id === reg.id);
            if (thisReg) {
              (thisReg as any).teamId = joinTeamId;
              (thisReg as any).teamRole = 'MEMBER';
              (thisReg as any).teamInvitationId = joinInvitationId;
            }
          }
        }
      } else {
        if (existingRegistration) {
          const regDocRef = getRegistrationRef(
            existingRegistration.tenureId || DEFAULT_TENURE_ID,
            existingRegistration.mainEventId || DEFAULT_MAIN_EVENT_ID,
            existingRegistration.eventId,
            existingRegistration.subEventId,
            existingRegistration.id
          );
          await updateDoc(regDocRef, {
            phoneSnapshot: validated.phone,
            regionSnapshot: validated.region,
            levelSnapshot: validated.level,
            programmeSnapshot: validated.programme,
            customAnswers,
            submissionAnswers: finalSubmissionAnswers,
            submittedAt,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Real Firestore Registration
          const regId = 'reg_' + Date.now();
          const regDocRef = getRegistrationRef(event.tenureId || DEFAULT_TENURE_ID, event.mainEventId || DEFAULT_MAIN_EVENT_ID, event.id, undefined, regId);

          const newRegistration: Record<string, any> = {
            id: regId,
            eventId: event.id,
            mainEventId: event.mainEventId || DEFAULT_MAIN_EVENT_ID,
            tenureId: event.tenureId || DEFAULT_TENURE_ID,
            eventTitle: event.name,
            userId: user.uid,
            nameSnapshot: user.name,
            emailSnapshot: user.email,
            phoneSnapshot: validated.phone,
            regionSnapshot: validated.region,
            levelSnapshot: validated.level,
            programmeSnapshot: validated.programme,
            registrationType: event.registrationType,
            status: 'CONFIRMED',
            customAnswers,
            submissionAnswers: finalSubmissionAnswers,
            submittedAt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add team fields
          if (isInitiator) {
            newRegistration.teamId = regId;
            newRegistration.teamRole = 'INITIATOR';
            if (teammateEmails.length > 0 && teamName.trim()) {
              newRegistration.teamName = teamName.trim();
            }
          }
          if (isJoiningTeam) {
            newRegistration.teamId = joinTeamId;
            newRegistration.teamRole = 'MEMBER';
            newRegistration.teamInvitationId = joinInvitationId;
          }

          await setDoc(regDocRef, newRegistration);

          // Update the event's current registration count
          const eventRef = getEventRef(event.tenureId || DEFAULT_TENURE_ID, event.mainEventId || DEFAULT_MAIN_EVENT_ID, event.id);
          await updateDoc(eventRef, {
            currentRegistrationCount: increment(1)
          });

          // Send team invitations via API
          if (isInitiator && teammateEmails.length > 0) {
            try {
              const { getAuth } = await import('firebase/auth');
              const authInstance = getAuth();
              const idToken = await authInstance.currentUser?.getIdToken();
              
              const res = await fetch('/api/team/invite', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  teammateEmails,
                  eventId: event.id,
                  mainEventId: event.mainEventId || DEFAULT_MAIN_EVENT_ID,
                  tenureId: event.tenureId || DEFAULT_TENURE_ID,
                  eventName: event.name,
                  teamRegistrationId: regId,
                  inviterName: user.name,
                }),
              });
              
              const data = await res.json();
              if (data.created || data.errors) {
                setInviteResults({ created: data.created || [], errors: data.errors || [] });
              }
            } catch (inviteErr: any) {
              console.error('Team invite error:', inviteErr);
              setInviteResults({ created: [], errors: ['Failed to send team invitations. You can invite teammates later from My Registrations.'] });
            }
          }
        }

        // Update user profile
        await updateProfile({
          phone: validated.phone,
          region: validated.region,
          level: validated.level,
          programme: validated.programme,
        });
      }

      setLoading(false);
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Failed to submit registration');
      }
    }
  };



  const getModalTitle = () => {
    if (isReviewing) return "Review Registration";
    if (existingRegistration) return "Edit Registration";
    if (isJoiningTeam) return "Join Team — Complete Registration";
    if (isTeamEvent) return "Team Registration";
    return "Event Registration";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      subtitle={isReviewing ? `Review Details • ${event.name}` : event.name}
      maxWidth="lg"
    >
      {error && (
        <div className="p-3.5 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isReviewing ? (
        /* ======== REVIEW VIEW ======== */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cream-100/50 dark:bg-kaziranga-900/40 border border-cream-400/30 dark:border-kaziranga-800 text-xs space-y-3.5 divide-y divide-cream-400/20 dark:divide-kaziranga-800">
            {/* Student & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-500 dark:text-cream-400/60 block mb-0.5">Full Name</span>
                <span className="font-bold text-kaziranga-900 dark:text-cream-100">{user.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-500 dark:text-cream-400/60 block mb-0.5">Student Email</span>
                <span className="font-mono text-kaziranga-900 dark:text-cream-100">{user.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-500 dark:text-cream-400/60 block mb-0.5">WhatsApp Number</span>
                <span className="font-mono font-medium text-kaziranga-900 dark:text-cream-100">{phone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-500 dark:text-cream-400/60 block mb-0.5">Academic Details</span>
                <span className="font-medium text-kaziranga-900 dark:text-cream-100">{region} • {level} • {programme}</span>
              </div>
            </div>

            {/* Team Details (if applicable) */}
            {(isInitiator || isJoiningTeam || existingRegistration?.teamRole) && (
              <div className="pt-3 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-600 dark:text-gold-400 block">Team Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/60 block">Role</span>
                    <span className="font-medium text-kaziranga-900 dark:text-cream-100">{isJoiningTeam ? 'Member (Joining Team)' : isInitiator ? 'Team Initiator' : existingRegistration?.teamRole}</span>
                  </div>
                  {teamName.trim() && (
                    <div>
                      <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/60 block">Team Name</span>
                      <span className="font-bold text-kaziranga-900 dark:text-cream-100">{teamName}</span>
                    </div>
                  )}
                </div>
                {teammateEmails.length > 0 && (
                  <div>
                    <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/60 block mb-1">Invited Teammates ({teammateEmails.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {teammateEmails.map(e => (
                        <span key={e} className="px-2 py-0.5 rounded-lg bg-cream-200/70 dark:bg-kaziranga-800 text-[11px] font-mono text-kaziranga-800 dark:text-cream-200">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Questions Answers (if any) */}
            {event.customQuestions && event.customQuestions.length > 0 && (
              <div className="pt-3 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-600 dark:text-gold-400 block">Questions & Responses</span>
                <div className="space-y-2">
                  {event.customQuestions.map(q => {
                    const val = customAnswers[q.id];
                    const displayVal = Array.isArray(val) ? val.join(', ') : (val || '—');
                    return (
                      <div key={q.id}>
                        <span className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 block">{q.question}</span>
                        <span className="text-xs font-medium text-kaziranga-900 dark:text-cream-100">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* During-Registration Submissions (if any) */}
            {hasDuringSubmissions && (
              <div className="pt-3 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-kaziranga-600 dark:text-gold-400 block">Submissions</span>
                <div className="space-y-2">
                  {duringSubmissionReqs.map(req => {
                    const val = (submissionAnswers[req.id] || '').trim();
                    const isUrl = val.startsWith('http://') || val.startsWith('https://');
                    return (
                      <div key={req.id}>
                        <span className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 block">{req.label}</span>
                        {isUrl ? (
                          <a href={val} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-kaziranga-800 dark:text-gold-400 hover:underline break-all">
                            {val} ↗
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-kaziranga-900 dark:text-cream-100">{val || '—'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* After-Registration Note in Review Section */}
          {hasAfterSubmissions && (
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
              Submissions can be uploaded or updated after registration from <strong>My Registrations</strong>{event.submissionDeadline ? ` before ${formatDate(event.submissionDeadline)}` : ''}.
            </div>
          )}

          {/* Review Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReviewing(false)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleFinalSubmit()}
              isLoading={loading}
            >
              {existingRegistration ? "Confirm Update" : isJoiningTeam ? "Join Team & Register" : isInitiator && teammateEmails.length > 0 ? "Register & Send Invites" : "Confirm Registration"}
            </Button>
          </div>
        </div>
      ) : (
        /* ======== EDIT FORM ======== */
        <form onSubmit={handleProceedToReview} className="space-y-4">
          {/* Team Join Banner */}
          {isJoiningTeam && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Joining an existing team</div>
                <div className="text-[11px] mt-0.5 text-sky-700 dark:text-sky-400">
                  Team information has been provided by the team initiator. Please complete your individual registration details below.
                </div>
              </div>
            </div>
          )}

          {/* Existing Team Status for Edit Mode */}
          {existingRegistration?.teamRole && (
            <div className="mb-4">
              <TeamStatusPanel registration={existingRegistration} event={event} />
            </div>
          )}

          {/* Read-Only Google Info Notice */}
          <div className="p-3 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800 text-xs text-kaziranga-700 dark:text-cream-400/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-kaziranga-800 dark:text-cream-100">
              <Lock className="w-3.5 h-3.5 text-kaziranga-500" />
              <span>Authenticated Student Credentials</span>
            </div>
            <div className="space-y-1 pt-1 text-kaziranga-600 dark:text-cream-400/60">
              <div>
                <span className="font-semibold text-kaziranga-800 dark:text-kaziranga-200">Name: </span>
                <span className="text-kaziranga-900 dark:text-cream-100 font-medium">{user.name}</span>
              </div>
              <div>
                <span className="font-semibold text-kaziranga-800 dark:text-kaziranga-200">Email: </span>
                <span className="text-kaziranga-900 dark:text-cream-100 font-mono text-[11px]">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Editable Registration / Profile Details */}
          <div className="space-y-3 pt-2">
            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
                WhatsApp Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="arena-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Region */}
              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                  Region <span className="text-rose-500">*</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="arena-select"
                  required
                >
                  <option value="" disabled>Select Region</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                  Academic Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="arena-select"
                  required
                >
                  <option value="" disabled>Select Academic Level</option>
                  {availableLevels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Programme */}
              <div>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                  Programme <span className="text-rose-500">*</span>
                </label>
                <select
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  className="arena-select"
                  required
                >
                  <option value="" disabled>Select Programme</option>
                  {availableProgrammes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Profile Sync Status Message */}
            <div className="pt-0.5">
              {isProfileModified ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                  <span>Will be updated in your profile after registration</span>
                </p>
              ) : (
                <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/50 flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0" />
                  <span>As per your current profile</span>
                </p>
              )}
            </div>
          </div>

          {/* Custom Questions Section */}
          {event.customQuestions && event.customQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
              {event.customQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100">
                    {q.question} {q.required && <span className="text-rose-500">*</span>}
                  </label>

                  {q.type === 'text' && (
                    <input
                      type="text"
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                      placeholder="Your answer"
                      className="arena-input text-xs"
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      rows={2}
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                      placeholder="Your answer"
                      className="arena-input text-xs"
                    />
                  )}

                  {q.type === 'radio' && (
                    <div className="space-y-1">
                      {q.options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`custom_q_${q.id}`}
                            required={q.required}
                            checked={customAnswers[q.id] === opt}
                            onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: opt })}
                            className="text-kaziranga-600 focus:ring-kaziranga-600"
                          />
                          <span className="text-xs text-kaziranga-700 dark:text-cream-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'checkbox' && (
                    <div className="space-y-1">
                      {q.options?.map((opt, i) => {
                        const currentList = customAnswers[q.id] || [];
                        return (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentList.includes(opt)}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const newList = val 
                                  ? [...currentList, opt] 
                                  : currentList.filter((item: string) => item !== opt);
                                setCustomAnswers({ ...customAnswers, [q.id]: newList });
                              }}
                              className="rounded text-kaziranga-600 focus:ring-kaziranga-600"
                            />
                            <span className="text-xs text-kaziranga-700 dark:text-cream-200">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Project Submissions Section (During Registration) */}
          {event.requireSubmission && hasDuringSubmissions && (
            <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
              {(event.duringSubmissionInstructions || event.submissionInstructions) && (
                <div className="p-2.5 rounded-xl bg-kaziranga-50/70 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800 text-[11px] text-kaziranga-700 dark:text-cream-400/80 leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/60 shrink-0 mt-0.5" />
                  <span>{event.duringSubmissionInstructions || event.submissionInstructions}</span>
                </div>
              )}

              {duringSubmissionReqs.map((req) => (
                <div key={req.id} className="space-y-1">
                  <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100">
                    {req.label} {req.required !== false && <span className="text-rose-500">*</span>}
                  </label>
                  {req.type === 'TEXT' ? (
                    <textarea
                      rows={3}
                      required={req.required !== false}
                      value={submissionAnswers[req.id] || ''}
                      onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                      className="arena-input text-xs"
                      placeholder="Your answer or submission details"
                    />
                  ) : (
                    <input
                      type="url"
                      required={req.required !== false}
                      value={submissionAnswers[req.id] || ''}
                      onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                      placeholder="https://..."
                      className="arena-input text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ======== TEAM MEMBER INVITATION SECTION ======== */}
          {isInitiator && !existingRegistration && (
            <div className="space-y-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-kaziranga-500 dark:text-kaziranga-400" />
                  Invite Teammates
                </h3>
                <Badge variant="gold" size="sm">
                  {teammateEmails.length + 1} / {maxTeamSize} members
                </Badge>
              </div>

              <div className="p-2.5 rounded-xl bg-kaziranga-50/70 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800 text-[11px] text-kaziranga-700 dark:text-cream-400/80 leading-relaxed">
                Invite up to <strong className="text-kaziranga-900 dark:text-cream-100">{maxTeamSize - 1}</strong> teammates by student email. They will be notified in-app to accept or decline. You can also invite teammates later from your dashboard.
              </div>

              {teammateEmails.length >= maxTeamSize - 1 ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Team is full!</strong> You have added the maximum allowed number of teammates ({maxTeamSize - 1}).
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-kaziranga-400" />
                      <input
                        type="email"
                        value={teammateInput}
                        onChange={(e) => { setTeammateInput(e.target.value); setTeammateError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTeammate(); } }}
                        placeholder="teammate@ds.study.iitm.ac.in"
                        className="arena-input text-xs pl-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddTeammate}
                      disabled={!teammateInput.trim() || isVerifyingEmail}
                      leftIcon={isVerifyingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    >
                      {isVerifyingEmail ? 'Checking' : 'Add'}
                    </Button>
                  </div>
                  {teammateError && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {teammateError}
                    </div>
                  )}
                  <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 text-right">
                    {maxTeamSize - 1 - teammateEmails.length} invite(s) remaining
                  </div>
                </div>
              )}

              {/* Added teammates list */}
              {teammateEmails.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    {teammateEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-cream-200/50 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-kaziranga-500 dark:text-kaziranga-400" />
                          <span className="text-xs font-mono text-kaziranga-800 dark:text-cream-200">{email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(email)}
                          className="p-1 text-kaziranga-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-cream-400/20 dark:border-kaziranga-800 pt-3">
                    <label className="block text-[11px] font-bold text-kaziranga-800 dark:text-cream-200">
                      Team Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="E.g. The Innovators"
                      className="arena-input text-xs"
                      required={teammateEmails.length > 0}
                    />
                    <div className="text-[10px] text-kaziranga-500 dark:text-cream-400/50">
                      Provide a name for your team.
                    </div>
                  </div>
                </div>
              )}

              {teammateEmails.length === 0 && (
                <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50 italic">
                  No teammates added yet. You can register solo and invite teammates later.
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
            <Button type="submit" variant="primary">
              Review Details →
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
