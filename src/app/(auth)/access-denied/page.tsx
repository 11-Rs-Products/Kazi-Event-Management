'use client';

import React, { useState } from 'react';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea, Input } from '@/components/ui/Field';
import { ShieldAlert, ArrowLeft, Send, CheckCircle2, HelpCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth, isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { isIITMEmail } from '@/lib/utils/emailValidation';

export default function AccessDeniedPage() {
  const { user, deniedEmail, logout } = useAuth();
  
  const activeEmail = (user?.email || deniedEmail || auth.currentUser?.email || '').trim().toLowerCase();
  const isIITM = isIITMEmail(activeEmail);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeEmail) {
      setErrorMsg('No authenticated email identity found. Please sign in again.');
      return;
    }

    if (!isIITMEmail(activeEmail)) {
      setErrorMsg('Access denied. Only official IITM study email accounts (@study.iitm.ac.in) can request access.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (isMockMode) {
        mockStore.addNotification({
          userId: 'SUPER_ADMIN',
          title: `Access Request: ${activeEmail}`,
          message: `Student ${activeEmail} has requested access to the Kaziranga House Portal.${noteInput.trim() ? ` Note: "${noteInput.trim()}"` : ''}`,
          type: 'WARNING',
          linkUrl: `/super-admin/allowed-users`,
        });

        mockStore.addAuditLog({
          actorUserId: 'UNAUTHORIZED_USER',
          actorEmail: activeEmail,
          action: 'ACCESS_REQUESTED',
          target: `Kaziranga Allowed-Users Registry (${activeEmail})`,
          timestamp: new Date().toISOString(),
          metadata: { note: noteInput.trim() },
        });
      } else {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/auth/request-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email: activeEmail, note: noteInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit access request.');
        }
      }

      setRequestSubmitted(true);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Access request error:', err);
      setErrorMsg(err.message || 'An error occurred while submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full ed-stage ed-mesh ed-grain overflow-hidden
      flex items-center justify-center p-6 sm:p-10">
      <div className="relative z-[2] w-full max-w-xl space-y-8">
        <div className="flex justify-center">
          <KazirangaLogo variant="full" size="lg" />
        </div>

        <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10
          shadow-e-4 p-7 sm:p-10 space-y-7">
          <div className="space-y-4 text-center">
            <span
              className="inline-grid place-items-center w-14 h-14 rounded-2xl
                bg-signal-danger/15 border border-signal-danger/30 text-signal-danger"
              aria-hidden
            >
              <ShieldAlert className="w-7 h-7" />
            </span>

            <h1 className="font-display font-black text-display-sm text-white">Access denied</h1>

            {isIITM ? (
              <p className="text-caption text-white/60 leading-relaxed max-w-md mx-auto">
                Your email is not currently listed in the official{' '}
                <span className="font-semibold text-white">Kaziranga House member registry</span>.
              </p>
            ) : (
              <p className="text-caption text-white/60 leading-relaxed max-w-md mx-auto">
                This account does not belong to IIT Madras. Sign in with your official study
                email address{' '}
                <span className="font-mono text-[rgb(var(--accent-vivid))]">
                  @xx.study.iitm.ac.in
                </span>
                .
              </p>
            )}

            {activeEmail && (
              <p className="text-micro font-mono text-white/35 break-all">{activeEmail}</p>
            )}
          </div>

          {isIITM ? (
            requestSubmitted ? (
              <div className="p-5 rounded-2xl bg-signal-live/10 border border-signal-live/25 space-y-3 text-left">
                <h2 className="flex items-center gap-2 font-display font-bold text-caption text-signal-live">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                  Request sent to house management
                </h2>
                <p className="text-micro text-white/60 leading-relaxed">
                  Your request for{' '}
                  <span className="font-mono text-white break-all">{activeEmail}</span> has been
                  delivered. You will be able to sign in once it is approved.
                </p>
                <p className="text-micro text-white/45 leading-relaxed pt-3 border-t border-white/10">
                  Approval requires an active student ID, enrolment in the BS Degree Programme,
                  and Kaziranga House membership.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 text-left">
                <h2 className="flex items-center gap-2 font-display font-bold text-caption text-[rgb(var(--accent-vivid))]">
                  <HelpCircle className="w-4 h-4 shrink-0" aria-hidden />
                  How to request access
                </h2>
                <ul className="space-y-2 text-micro text-white/60 leading-relaxed">
                  <li className="flex gap-2.5">
                    <span className="text-[rgb(var(--accent-vivid))] shrink-0" aria-hidden>
                      01
                    </span>
                    Access is granted only to active BS Degree students in Kaziranga House.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="text-[rgb(var(--accent-vivid))] shrink-0" aria-hidden>
                      02
                    </span>
                    Send a verification request to house management using the button below.
                  </li>
                </ul>
              </div>
            )
          ) : (
            <div className="p-5 rounded-2xl bg-signal-danger/10 border border-signal-danger/25 space-y-2 text-left">
              <h2 className="flex items-center gap-2 font-display font-bold text-caption text-signal-danger">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                Non-IITM account detected
              </h2>
              <p className="text-micro text-white/60 leading-relaxed">
                Personal accounts (Gmail, Yahoo, Outlook and similar) cannot request access to
                the Kaziranga House event portal.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => logout()}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-white border-white/20 hover:bg-white/10 hover:border-white/35"
            >
              Back to sign in
            </Button>

            {isIITM && !requestSubmitted && (
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={() => setIsModalOpen(true)}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Request access
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Access Request Submission Modal */}
      {isIITM && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eyebrow="Verification"
          title="Request access"
          subtitle="House management will review and approve your account."
        >
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption"
              >
                {errorMsg}
              </div>
            )}

            <Input
              type="email"
              readOnly
              disabled
              label="Student email address"
              hint="Taken from your authenticated Google account."
              value={activeEmail}
              className="font-mono"
            />

            <Textarea
              rows={3}
              label={
                <>
                  Note for management{' '}
                  <span className="font-normal text-ink-faint">(optional)</span>
                </>
              }
              placeholder="e.g. your full name, region, or any relevant details…"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-hairline">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
