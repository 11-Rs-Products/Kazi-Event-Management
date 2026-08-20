'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, Registration } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { registrationSchema } from '@/lib/validation/schemas';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { CheckCircle2, Lock, User, Phone, MapPin, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { setDoc, updateDoc, increment } from 'firebase/firestore';
import { getRegistrationRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
interface RegistrationModalProps {
  event: EventItem | null;
  existingRegistration?: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  existingRegistration,
  isOpen,
  onClose,
  onSuccess,
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
        // Fallback for old single-string format
        setSubmissionAnswers({ legacy: existingRegistration.submissionContent });
      }
    } else if (user) {
      setPhone(user.phone || '');
      setRegion(user.region || 'East');
      setLevel(user.level || 'Diploma');
      setProgramme(user.programme || '');
      setSubmissionAnswers({});
    }
  }, [user, existingRegistration, isOpen]);

  if (!event || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      const validated = registrationSchema.parse({
        eventId: event.id,
        phone,
        region,
        level,
        programme,
        submissionAnswers,
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
        if (event.submissionRequirements && event.submissionRequirements.length > 0) {
          for (const req of event.submissionRequirements) {
            const val = submissionAnswers[req.id];
            if (!val || !val.trim()) {
              setError(`Please provide your submission for: ${req.label}`);
              setLoading(false);
              return;
            }
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
          mockStore.registerForEvent(event, user, {
            phone: validated.phone,
            region: validated.region,
            level: validated.level,
            programme: validated.programme,
            customAnswers,
            submissionAnswers: finalSubmissionAnswers,
            submittedAt,
          });
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
          // Real Firestore Registration Transaction/Write
          const regId = 'reg_' + Date.now();
          const regDocRef = getRegistrationRef(event.tenureId || DEFAULT_TENURE_ID, event.mainEventId || DEFAULT_MAIN_EVENT_ID, event.id, undefined, regId);

          const newRegistration = {
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

          await setDoc(regDocRef, newRegistration);

          // Update the event's current registration count
          const eventRef = getEventRef(event.tenureId || DEFAULT_TENURE_ID, event.mainEventId || DEFAULT_MAIN_EVENT_ID, event.id);
          await updateDoc(eventRef, {
            currentRegistrationCount: increment(1)
          });
        }

        // Update user profile automatically with new phone/region details
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingRegistration ? "Edit Registration" : "Event Registration"}
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
              <div className="space-y-4 p-3 bg-cream-200/40 dark:bg-kaziranga-900/50 rounded-xl border border-cream-400/30 dark:border-kaziranga-800">
                {event.submissionInstructions && (
                  <p className="text-[11px] text-kaziranga-600 dark:text-cream-400/70 leading-relaxed mb-2">
                    {event.submissionInstructions}
                  </p>
                )}
                {event.submissionRequirements?.map((req) => (
                  <div key={req.id} className="space-y-1">
                    <label className="block text-[11px] font-bold text-kaziranga-800 dark:text-cream-200">
                      {req.label} <span className="text-rose-500">*</span>
                    </label>
                    {req.type === 'TEXT' ? (
                      <textarea
                        rows={3}
                        required
                        value={submissionAnswers[req.id] || ''}
                        onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                        className="arena-input text-xs"
                      />
                    ) : (
                      <input
                        type="url"
                        required
                        value={submissionAnswers[req.id] || ''}
                        onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                        placeholder="https://..."
                        className="arena-input text-xs"
                      />
                    )}
                  </div>
                ))}
                {(!event.submissionRequirements || event.submissionRequirements.length === 0) && (
                   <p className="text-[11px] text-rose-500">Error: Admin has not configured any submission fields.</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <div className="font-bold shrink-0">ℹ️ Note:</div>
                <div className="leading-relaxed">
                  Submissions for this event will be accepted <strong>after registration</strong>. You can submit or update your deliverables from your <strong>My Registrations</strong> portal anytime before the submission deadline{event.submissionDeadline ? ` (${new Date(event.submissionDeadline).toLocaleString()})` : ''}.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Button type="submit" variant="primary" isLoading={loading}>
            {existingRegistration ? "Update Details" : "Confirm Registration"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
