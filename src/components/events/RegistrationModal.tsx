'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, Registration } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { registrationSchema } from '@/lib/validation/schemas';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { CheckCircle2, Lock, User, Phone, MapPin, GraduationCap, BookOpen, AlertCircle, Users, Plus, X, Mail, UserPlus, Loader2 } from 'lucide-react';
import { setDoc, updateDoc, increment } from 'firebase/firestore';
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

  useEffect(() => {
    if (existingRegistration) {
      setPhone(existingRegistration.phoneSnapshot || user?.phone || '');
      setRegion(existingRegistration.regionSnapshot || user?.region || 'East');
      setLevel(existingRegistration.levelSnapshot || user?.level || 'Diploma');
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
      setRegion(user.region || 'East');
      setLevel(user.level || 'Diploma');
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
      const res = await fetch('/api/auth/allowed-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok || !data.isAllowed) {
        setTeammateError('Either it is an invalid email or it is not an email associated with Kaziranga.');
        setIsVerifyingEmail(false);
        return;
      }

      setTeammateEmails([...teammateEmails, email]);
      setTeammateInput('');
    } catch (err) {
      setTeammateError('Error verifying email. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleRemoveTeammate = (email: string) => {
    setTeammateEmails(teammateEmails.filter(e => e !== email));
    setTeammateError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      subtitle={event.name}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            <span>Authenticated Google Student Credentials</span>
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
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/50" />
              <span>WhatsApp Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="arena-input"
            />
            <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/50 mt-1">
              This phone number will be automatically saved to your profile for future event registrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Region */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="arena-select"
              >
                <option value="All">All</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Chennai">Chennai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Patna">Patna</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="arena-select"
              >
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Degree">Degree</option>
              </select>
            </div>

            {/* Programme */}
            <div>
              <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1">
                Programme
              </label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="arena-select"
                required
              >
                <option value="" disabled>Select Programme</option>
                <option value="Data Science & Applications">Data Science & Applications</option>
                <option value="Diploma in Programming">Diploma in Programming</option>
                <option value="Diploma in Data Science">Diploma in Data Science</option>
                <option value="Electronic Systems">Electronic Systems</option>
                <option value="Management and Data Science">Management and Data Science</option>
                <option value="Aeronautics and Space Technology">Aeronautics and Space Technology</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Questions Section */}
        {event.customQuestions && event.customQuestions.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
            <h3 className="text-xs font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider">
              Additional Information Required
            </h3>
            {event.customQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-100 mb-1.5">
                  {q.question} {q.required && <span className="text-rose-500">*</span>}
                </label>
                {q.type === 'text' && (
                  <input
                    type="text"
                    required={q.required}
                    value={customAnswers[q.id] || ''}
                    onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                    className="arena-input"
                    placeholder="Your answer"
                  />
                )}
                {q.type === 'textarea' && (
                  <textarea
                    required={q.required}
                    rows={3}
                    value={customAnswers[q.id] || ''}
                    onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                    className="arena-input"
                    placeholder="Your answer"
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

            <div className="p-3 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800 text-[11px] text-kaziranga-700 dark:text-cream-400/80 leading-relaxed">
              <span className="font-bold text-kaziranga-900 dark:text-cream-200">How this works: </span>
              Add your teammates by their registered email address. You can invite up to <strong className="text-kaziranga-900 dark:text-cream-100">{maxTeamSize - 1}</strong> more people. 
              They will receive an in-app notification and can accept or decline. You can also invite teammates later from your registrations dashboard.
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

        {/* Project Submissions Section */}
        {event.requireSubmission && (
          <div className="space-y-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
            <h3 className="text-xs font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider flex items-center justify-between">
              <span>Project / Deliverable Submission</span>
              {(Array.isArray(event.submissionTiming) ? event.submissionTiming.includes('DURING_REGISTRATION') : event.submissionTiming === 'DURING_REGISTRATION') && (
                <span className="text-[10px] text-rose-500 font-bold">Required to Register</span>
              )}
            </h3>

            {(Array.isArray(event.submissionTiming) ? event.submissionTiming.includes('DURING_REGISTRATION') : event.submissionTiming === 'DURING_REGISTRATION') ? (
              <div className="space-y-4 p-3.5 bg-cream-200/40 dark:bg-kaziranga-900/50 rounded-xl border border-cream-400/30 dark:border-kaziranga-800">
                {(event.duringSubmissionInstructions || event.submissionInstructions) && (
                  <p className="text-[11px] text-kaziranga-600 dark:text-cream-400/70 leading-relaxed mb-2">
                    {event.duringSubmissionInstructions || event.submissionInstructions}
                  </p>
                )}
                {(event.submissionRequirements || [])
                  .filter((r) => (r.timing || 'DURING_REGISTRATION') === 'DURING_REGISTRATION')
                  .map((req) => (
                    <div key={req.id} className="space-y-1">
                      <label className="block text-[11px] font-bold text-kaziranga-800 dark:text-cream-200">
                        {req.label} {req.required !== false && <span className="text-rose-500">*</span>}
                      </label>
                      {req.type === 'TEXT' ? (
                        <textarea
                          rows={3}
                          required={req.required !== false}
                          value={submissionAnswers[req.id] || ''}
                          onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                          className="arena-input text-xs"
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

                {(Array.isArray(event.submissionTiming) ? event.submissionTiming.includes('AFTER_REGISTRATION') : event.submissionTiming === 'AFTER_REGISTRATION') && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-300">
                    ℹ️ <strong>Additional Deliverables Note:</strong> Additional project artifacts will be submitted after registration via your <strong>My Registrations</strong> portal before the submission deadline{event.submissionDeadline ? ` (${formatDate(event.submissionDeadline)})` : ''}.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <div className="font-bold shrink-0">ℹ️ Note:</div>
                <div className="leading-relaxed">
                  Submissions for this event will be accepted <strong>after registration</strong>. You can submit or update your deliverables from your <strong>My Registrations</strong> portal anytime before the submission deadline{event.submissionDeadline ? ` (${formatDate(event.submissionDeadline)})` : ''}.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Button type="submit" variant="primary" isLoading={loading}>
            {existingRegistration ? "Update Details" : isJoiningTeam ? "Join Team & Register" : isInitiator ? "Register & Send Invites" : "Confirm Registration"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
