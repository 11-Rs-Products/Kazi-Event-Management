'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EventItem, Registration } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UrlInput } from '../ui/UrlInput';
import { registrationSchema } from '@/lib/validation/schemas';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { CheckCircle2, Lock, User, Phone, MapPin, GraduationCap, BookOpen, AlertCircle, Users, Plus, X, Mail, UserPlus, Loader2, Info, ArrowLeft } from 'lucide-react';
import { setDoc, updateDoc, increment, doc, getDoc } from 'firebase/firestore';
import { getRegistrationRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { TeamStatusPanel } from './TeamStatusPanel';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import { isValidUrl, normalizeUrl } from '@/lib/utils/urlValidation';

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
        if (typeof answer === 'string' && answer.trim()) {
          const isLinkQuestion = /(link|url|drive|github|portfolio|figma|website|linkedin|repo)/i.test(q.question);
          if (isLinkQuestion && !isValidUrl(answer.trim())) {
            setError(`Please enter a valid web link (e.g. https://...) for: "${q.question}"`);
            return;
          }
        }
      }
    }

    // Validate during-registration submissions
    if (hasDuringSubmissions) {
      for (const req of duringSubmissionReqs) {
        const val = (submissionAnswers[req.id] || '').trim();
        if (req.required !== false && !val) {
          setError(`Please provide your submission for: ${req.label}`);
          return;
        }
        if (req.type === 'LINK' && val && !isValidUrl(val)) {
          setError(`Please enter a valid web link (e.g. https://...) for: "${req.label}"`);
          return;
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
          const val = (submissionAnswers[req.id] || '').trim();
          if (req.required !== false && !val) {
            setError(`Please provide your submission for: ${req.label}`);
            setLoading(false);
            return;
          }
          if (req.type === 'LINK' && val && !isValidUrl(val)) {
            setError(`Please enter a valid web link (e.g. https://...) for: "${req.label}"`);
            setLoading(false);
            return;
          }
        }
      }

      const finalSubmissionAnswers: Record<string, string> = {};
      let hasSubmission = false;
      Object.entries(submissionAnswers).forEach(([k, v]) => {
        if (v && v.trim()) {
          const req = (event.submissionRequirements || []).find((r) => r.id === k);
          const normalized = req?.type === 'LINK' && isValidUrl(v.trim()) ? normalizeUrl(v.trim()) : v.trim();
          finalSubmissionAnswers[k] = normalized;
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
      {/* ─── Step progress indicator ─── */}
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-hairline">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-micro font-display font-bold uppercase tracking-wider transition-colors',
            !isReviewing
              ? 'bg-brand/15 text-brand dark:bg-brand/20 dark:text-brand ring-1 ring-brand/30'
              : 'bg-surface-sunken text-ink-faint'
          )}
        >
          <span className="w-4 h-4 rounded-full bg-brand text-brand-contrast inline-grid place-items-center text-[0.625rem] font-bold">
            1
          </span>
          Details
        </span>
        <span className="w-5 h-px bg-hairline" aria-hidden />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-micro font-display font-bold uppercase tracking-wider transition-colors',
            isReviewing
              ? 'bg-brand/15 text-brand dark:bg-brand/20 dark:text-brand ring-1 ring-brand/30'
              : 'bg-surface-sunken text-ink-faint'
          )}
        >
          <span className="w-4 h-4 rounded-full bg-surface-raised border border-hairline inline-grid place-items-center text-[0.625rem] text-ink-muted">
            2
          </span>
          Review &amp; Confirm
        </span>
      </div>

      {error && (
        <div className="p-3.5 mb-4 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isReviewing ? (
        /* ======== REVIEW VIEW ======== */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-sunken border border-hairline text-caption space-y-3.5 divide-y divide-hairline">
            {/* Student & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-micro uppercase font-bold tracking-wider text-ink-faint block mb-0.5">Full Name</span>
                <span className="font-bold text-ink">{user.name}</span>
              </div>
              <div>
                <span className="text-micro uppercase font-bold tracking-wider text-ink-faint block mb-0.5">Student Email</span>
                <span className="font-mono text-ink">{user.email}</span>
              </div>
              <div>
                <span className="text-micro uppercase font-bold tracking-wider text-ink-faint block mb-0.5">WhatsApp Number</span>
                <span className="font-mono font-medium text-ink">{phone}</span>
              </div>
              <div>
                <span className="text-micro uppercase font-bold tracking-wider text-ink-faint block mb-0.5">Academic Details</span>
                <span className="font-medium text-ink">{region} • {level} • {programme}</span>
              </div>
            </div>

            {/* Team Details (if applicable) */}
            {(isInitiator || isJoiningTeam || existingRegistration?.teamRole) && (
              <div className="pt-3 space-y-2.5">
                <span className="text-micro uppercase font-bold tracking-wider text-accent block">Team Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-micro text-ink-faint block">Role</span>
                    <span className="font-medium text-ink">{isJoiningTeam ? 'Member (Joining Team)' : isInitiator ? 'Team Initiator' : existingRegistration?.teamRole}</span>
                  </div>
                  {teamName.trim() && (
                    <div>
                      <span className="text-micro text-ink-faint block">Team Name</span>
                      <span className="font-bold text-ink">{teamName}</span>
                    </div>
                  )}
                </div>
                {teammateEmails.length > 0 && (
                  <div>
                    <span className="text-micro text-ink-faint block mb-1">Invited Teammates ({teammateEmails.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {teammateEmails.map(e => (
                        <span key={e} className="px-2 py-0.5 rounded-lg bg-surface-raised text-caption font-mono text-ink">
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
                <span className="text-micro uppercase font-bold tracking-wider text-accent block">Questions & Responses</span>
                <div className="space-y-2">
                  {event.customQuestions.map(q => {
                    const val = customAnswers[q.id];
                    const displayVal = Array.isArray(val) ? val.join(', ') : (val || '—');
                    return (
                      <div key={q.id}>
                        <span className="text-caption text-ink-faint block">{q.question}</span>
                        <span className="text-caption font-medium text-ink">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* During-Registration Submissions (if any) */}
            {hasDuringSubmissions && (
              <div className="pt-3 space-y-2.5">
                <span className="text-micro uppercase font-bold tracking-wider text-accent block">Submissions</span>
                <div className="space-y-2">
                  {duringSubmissionReqs.map(req => {
                    const val = (submissionAnswers[req.id] || '').trim();
                    const isUrl = val.startsWith('http://') || val.startsWith('https://');
                    return (
                      <div key={req.id}>
                        <span className="text-caption text-ink-faint block">{req.label}</span>
                        {isUrl ? (
                          <a href={val} target="_blank" rel="noopener noreferrer" className="text-caption font-bold text-ink dark:text-accent hover:underline break-all">
                            {val} ↗
                          </a>
                        ) : (
                          <span className="text-caption font-medium text-ink">{val || '—'}</span>
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
            <div className="p-2.5 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-caption text-signal-warn leading-relaxed">
              Submissions can be uploaded or updated after registration from <strong>My Registrations</strong>{event.submissionDeadline ? ` before ${formatDate(event.submissionDeadline)}` : ''}.
            </div>
          )}

          {/* Review Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-hairline">
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
            <div className="p-3 rounded-xl bg-signal-info/10 border border-signal-info/25 text-caption text-signal-info flex items-start gap-2">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Joining an existing team</div>
                <div className="text-caption mt-0.5 text-signal-info">
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
          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink-muted space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Lock className="w-3.5 h-3.5 text-ink-faint" />
              <span>Authenticated Student Credentials</span>
            </div>
            <div className="space-y-1 pt-1 text-ink-muted">
              <div>
                <span className="font-semibold text-ink dark:text-ink">Name: </span>
                <span className="text-ink font-medium">{user.name}</span>
              </div>
              <div>
                <span className="font-semibold text-ink dark:text-ink">Email: </span>
                <span className="text-ink font-mono text-caption">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Editable Registration / Profile Details */}
          <div className="space-y-3 pt-2">
            {/* Phone Number Field */}
            <div>
              <label className="block text-caption font-bold text-ink mb-1.5">
                WhatsApp Number <span className="text-signal-danger">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="ed-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Region */}
              <div>
                <label className="block text-caption font-bold text-ink mb-1">
                  Region <span className="text-signal-danger">*</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="ed-select"
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
                <label className="block text-caption font-bold text-ink mb-1">
                  Academic Level <span className="text-signal-danger">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="ed-select"
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
                <label className="block text-caption font-bold text-ink mb-1">
                  Programme <span className="text-signal-danger">*</span>
                </label>
                <select
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  className="ed-select"
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
                <p className="text-caption text-signal-warn font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-warn shrink-0 animate-pulse" />
                  <span>Will be updated in your profile after registration</span>
                </p>
              ) : (
                <p className="text-caption text-ink-faint flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-live shrink-0" />
                  <span>As per your current profile</span>
                </p>
              )}
            </div>
          </div>

          {/* Custom Questions Section */}
          {event.customQuestions && event.customQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-hairline">
              {event.customQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-caption font-bold text-ink">
                    {q.question} {q.required && <span className="text-signal-danger">*</span>}
                  </label>

                  {q.type === 'text' && (
                    <input
                      type="text"
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                      placeholder="Your answer"
                      className="ed-field text-caption"
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      rows={2}
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                      placeholder="Your answer"
                      className="ed-field text-caption"
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
                            className="text-ink-muted focus:ring-accent/30"
                          />
                          <span className="text-caption text-ink">{opt}</span>
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
                              className="rounded text-ink-muted focus:ring-accent/30"
                            />
                            <span className="text-caption text-ink">{opt}</span>
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
            <div className="space-y-4 pt-4 border-t border-hairline">
              {(event.duringSubmissionInstructions || event.submissionInstructions) && (
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink-muted leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-ink-faint shrink-0 mt-0.5" />
                  <span>{event.duringSubmissionInstructions || event.submissionInstructions}</span>
                </div>
              )}

              {duringSubmissionReqs.map((req) => (
                <div key={req.id} className="space-y-1">
                  <label className="block text-caption font-bold text-ink">
                    {req.label} {req.required !== false && <span className="text-signal-danger">*</span>}
                  </label>
                  {req.type === 'TEXT' ? (
                    <textarea
                      rows={3}
                      required={req.required !== false}
                      value={submissionAnswers[req.id] || ''}
                      onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                      className="ed-field text-caption"
                      placeholder="Your answer or submission details"
                    />
                  ) : (
                    <UrlInput
                      required={req.required !== false}
                      value={submissionAnswers[req.id] || ''}
                      onChange={(val) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: val })}
                      placeholder="https://..."
                      className="text-caption"
                      errorMessage="Please enter a valid web link (e.g. https://drive.google.com/...)"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ======== TEAM MEMBER INVITATION SECTION ======== */}
          {isInitiator && !existingRegistration && (
            <div className="space-y-3 pt-4 border-t border-hairline">
              <div className="flex items-center justify-between">
                <h3 className="text-caption font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-ink-faint" />
                  Invite Teammates
                </h3>
                <Badge tone="accent" size="sm">
                  {teammateEmails.length + 1} / {maxTeamSize} members
                </Badge>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink-muted leading-relaxed">
                Invite up to <strong className="text-ink">{maxTeamSize - 1}</strong> teammates by student email. They will be notified in-app to accept or decline. You can also invite teammates later from your dashboard.
              </div>

              {teammateEmails.length >= maxTeamSize - 1 ? (
                <div className="p-3 rounded-xl bg-signal-live/10 border border-signal-live/25 flex items-center gap-2 text-caption text-signal-live">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-signal-live" />
                  <span>
                    <strong>Team is full!</strong> You have added the maximum allowed number of teammates ({maxTeamSize - 1}).
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
                      <input
                        type="email"
                        value={teammateInput}
                        onChange={(e) => { setTeammateInput(e.target.value); setTeammateError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTeammate(); } }}
                        placeholder="teammate@ds.study.iitm.ac.in"
                        className="ed-field text-caption pl-9"
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
                    <div className="text-caption text-signal-danger flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {teammateError}
                    </div>
                  )}
                  <div className="text-micro text-ink-faint text-right">
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-sunken border border-hairline"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-ink-faint" />
                          <span className="text-caption font-mono text-ink">{email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(email)}
                          className="p-1 text-ink-faint hover:text-signal-danger transition-colors rounded-lg hover:bg-signal-danger/10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-hairline pt-3">
                    <label className="block text-caption font-bold text-ink">
                      Team Name <span className="text-signal-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="E.g. The Innovators"
                      className="ed-field text-caption"
                      required={teammateEmails.length > 0}
                    />
                    <div className="text-micro text-ink-faint">
                      Provide a name for your team.
                    </div>
                  </div>
                </div>
              )}

              {teammateEmails.length === 0 && (
                <div className="text-caption text-ink-faint italic">
                  No teammates added yet. You can register solo and invite teammates later.
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button type="submit" variant="primary">
              Review Details →
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
