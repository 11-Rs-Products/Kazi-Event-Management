import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Registration, EventItem } from '@/types';
import { updateDoc } from 'firebase/firestore';
import { getRegistrationRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { useAuth } from '@/context/AuthContext';

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
    if (!registration || !user) return;
    setIsSubmittingWork(true);
    setSubmissionError(null);

    try {
      const finalSubmissionAnswers: Record<string, string> = {};
      let hasSubmission = false;
      Object.entries(submissionAnswers).forEach(([k, v]) => {
        if (v && v.trim()) {
          finalSubmissionAnswers[k] = v.trim();
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
      title={`Project Deliverable: ${event.name || 'Event'}`}
      subtitle="Provide or update your project submission link or solution notes."
    >
      <form onSubmit={handleSaveSubmission} className="space-y-4">
        {submissionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {!event.submissionRequirements || event.submissionRequirements.length === 0 ? (
          <div className="space-y-3">
             <p className="text-[11px] text-rose-500">Error: Admin has not configured any submission fields.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(event.afterSubmissionInstructions || event.submissionInstructions) && (
              <div className="p-3 rounded-xl bg-cream-200/50 dark:bg-kaziranga-900/60 border border-cream-400/30 dark:border-kaziranga-800 text-xs text-kaziranga-800 dark:text-cream-200 leading-relaxed">
                <span className="font-bold">Instructions:</span> {event.afterSubmissionInstructions || event.submissionInstructions}
              </div>
            )}

            {event.submissionRequirements.map((req) => {
              const dl = req.deadline || event.submissionDeadline;
              const isPassed = dl ? new Date() > new Date(dl) : false;
              const isDuring = req.timing === 'DURING_REGISTRATION';
              
              return (
              <div key={req.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[11px] font-bold text-kaziranga-800 dark:text-cream-200">
                      {req.label} {req.required !== false && <span className="text-rose-500">*</span>}
                    </label>
                    {isDuring && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cream-300/40 dark:bg-kaziranga-800 text-kaziranga-600 dark:text-cream-400/60">
                        During Reg
                      </span>
                    )}
                  </div>
                  {dl && (
                    <span className={`text-[10px] font-bold ${isPassed ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isPassed ? 'Deadline Passed' : `Due: ${formatDate(dl)}`}
                    </span>
                  )}
                </div>
                {req.type === 'TEXT' ? (
                  <textarea
                    rows={3}
                    required={!isPassed && req.required !== false}
                    disabled={isPassed}
                    value={submissionAnswers[req.id] || ''}
                    onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                    className={`arena-input text-xs ${isPassed ? 'opacity-50 cursor-not-allowed bg-cream-300/30 dark:bg-kaziranga-900/30' : ''}`}
                  />
                ) : (
                  <input
                    type="url"
                    required={!isPassed && req.required !== false}
                    disabled={isPassed}
                    value={submissionAnswers[req.id] || ''}
                    onChange={(e) => setSubmissionAnswers({ ...submissionAnswers, [req.id]: e.target.value })}
                    placeholder="https://..."
                    className={`arena-input text-xs ${isPassed ? 'opacity-50 cursor-not-allowed bg-cream-300/30 dark:bg-kaziranga-900/30' : ''}`}
                  />
                )}
              </div>
            )})}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmittingWork}>
            Save Submission
          </Button>
        </div>
      </form>
    </Modal>
  );
};
