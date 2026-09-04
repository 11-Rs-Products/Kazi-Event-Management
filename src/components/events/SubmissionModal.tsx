import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UrlInput } from '../ui/UrlInput';
import { Registration, EventItem } from '@/types';
import { updateDoc } from 'firebase/firestore';
import { getRegistrationRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils/cn';
import { isValidUrl, normalizeUrl } from '@/lib/utils/urlValidation';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  registration: Registration | null;
  onSuccess: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose, event, registration, onSuccess }) => {
  const { user } = useAuth();
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<string, string>>({});
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && registration) {
      setSubmissionAnswers(registration.submissionAnswers || { default: registration.submissionContent || '' });
      setSubmissionError(null);
    }
  }, [isOpen, registration]);

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !user || !event) return;
    setIsSubmittingWork(true);
    setSubmissionError(null);

    try {
      if (event.submissionRequirements && event.submissionRequirements.length > 0) {
        for (const req of event.submissionRequirements) {
          const dl = req.deadline || event.submissionDeadline;
          const isPassed = dl ? new Date() > new Date(dl) : false;
          if (isPassed) continue;

          const val = (submissionAnswers[req.id] || '').trim();
          if (req.required !== false && !val) {
            setSubmissionError(`Please provide your submission for: "${req.label}"`);
            setIsSubmittingWork(false);
            return;
          }
          if (req.type === 'LINK' && val && !isValidUrl(val)) {
            setSubmissionError(`Please enter a valid web link (e.g. https://...) for: "${req.label}"`);
            setIsSubmittingWork(false);
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
      const submittedAt = hasSubmission ? new Date().toISOString() : null;

      if (isMockMode) {
        mockStore.updateRegistration(registration.id, user.uid, {
          submissionAnswers: finalSubmissionAnswers,
          submittedAt,
        });
      } else {
        const tenure = registration.tenureId || DEFAULT_TENURE_ID;
        const mainEvent = registration.mainEventId || DEFAULT_MAIN_EVENT_ID;
        const docRef = getRegistrationRef(tenure, mainEvent, registration.eventId, registration.subEventId, registration.id);
        await updateDoc(docRef, {
          submissionAnswers: finalSubmissionAnswers,
          submittedAt,
          updatedAt: submittedAt,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmissionError(err.message || 'Failed to save submission.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  if (!event || !registration) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Deliverable"
      title={event.name || 'Project submission'}
      subtitle="Provide or update your submission links and notes."
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          {/* Submits the form rendered in the modal body. */}
          <Button
            type="submit"
            form="submission-form"
            variant="primary"
            size="md"
            isLoading={isSubmittingWork}
          >
            Save submission
          </Button>
        </>
      }
    >
      <form onSubmit={handleSaveSubmission} id="submission-form" className="space-y-5">
        {submissionError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>{submissionError}</span>
          </div>
        )}

        {!event.submissionRequirements || event.submissionRequirements.length === 0 ? (
          <p className="p-3.5 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-caption text-signal-warn">
            No submission fields have been configured for this event yet. Please contact an
            organiser.
          </p>
        ) : (
          <>
            {(event.afterSubmissionInstructions || event.submissionInstructions) && (
              <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-1.5">
                <p className="ed-eyebrow-plain text-ink-faint">Instructions</p>
                <p className="text-caption text-ink-muted leading-relaxed">
                  {event.afterSubmissionInstructions || event.submissionInstructions}
                </p>
              </div>
            )}

            <div className="space-y-5">
              {event.submissionRequirements.map((req) => {
                const dl = req.deadline || event.submissionDeadline;
                const isPassed = dl ? new Date() > new Date(dl) : false;
                const isDuring = req.timing === 'DURING_REGISTRATION';
                const fieldId = `submission-${req.id}`;

                return (
                  <div key={req.id} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <label
                        htmlFor={fieldId}
                        className="flex items-center gap-2 text-caption font-semibold text-ink-muted"
                      >
                        {req.label}
                        {req.required !== false && (
                          <span className="text-signal-danger">*</span>
                        )}
                        {isDuring && (
                          <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-display font-bold uppercase tracking-wider bg-surface-sunken text-ink-faint border border-hairline">
                            During reg
                          </span>
                        )}
                      </label>

                      {dl && (
                        <span
                          className={
                            isPassed
                              ? 'text-micro font-semibold text-signal-danger'
                              : 'text-micro font-semibold text-ink-faint'
                          }
                        >
                          {isPassed ? 'Deadline passed' : `Due ${formatDate(dl)}`}
                        </span>
                      )}
                    </div>

                    {req.type === 'TEXT' ? (
                      <textarea
                        id={fieldId}
                        rows={3}
                        required={!isPassed && req.required !== false}
                        disabled={isPassed}
                        value={submissionAnswers[req.id] || ''}
                        onChange={(e) =>
                          setSubmissionAnswers({
                            ...submissionAnswers,
                            [req.id]: e.target.value,
                          })
                        }
                        className="ed-field resize-y"
                      />
                    ) : (
                      <UrlInput
                        id={fieldId}
                        required={!isPassed && req.required !== false}
                        disabled={isPassed}
                        value={submissionAnswers[req.id] || ''}
                        onChange={(val) =>
                          setSubmissionAnswers({
                            ...submissionAnswers,
                            [req.id]: val,
                          })
                        }
                        placeholder="https://…"
                        errorMessage="Please enter a valid web link (e.g. https://drive.google.com/...)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
