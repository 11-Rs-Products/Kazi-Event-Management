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
    <div className="relative min-h-screen w-full bg-[#FAF8F5] dark:bg-[#121212] text-black dark:text-white overflow-hidden flex items-center justify-center p-6 sm:p-10">
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.38] pointer-events-none dark:hidden"
        style={{
          backgroundImage: 'radial-gradient(#121212 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none hidden dark:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-[2] w-full max-w-xl space-y-8">
        <div className="flex justify-center">
          <KazirangaLogo variant="full" size="lg" />
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#1e1e1e] border-2 border-black dark:border-white
          shadow-[8px_8px_0px_#121212] dark:shadow-[8px_8px_0px_#ffffff] p-7 sm:p-10 space-y-7">
          <div className="space-y-4 text-center">
            <span
              className="inline-grid place-items-center w-16 h-16 rounded-2xl
                bg-[#FFA0A0] border-2 border-black shadow-[3px_3px_0px_#121212] text-black"
              aria-hidden
            >
              <ShieldAlert className="w-8 h-8" />
            </span>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border-2 border-black bg-[#FFE873] text-black font-display font-black text-eyebrow uppercase shadow-[2px_2px_0px_#121212]">
                ✦ Authorization notice
              </div>
              <h1 className="font-display font-black text-display-sm text-black dark:text-white">
                Access denied
              </h1>
            </div>

            {isIITM ? (
              <p className="text-caption text-gray-700 dark:text-gray-300 leading-relaxed max-w-md mx-auto font-medium">
                Your email is not currently listed in the official{' '}
                <span className="font-bold text-black dark:text-white underline decoration-2 decoration-[#FFE873]">
                  Kaziranga House member registry
                </span>
                .
              </p>
            ) : (
              <p className="text-caption text-gray-700 dark:text-gray-300 leading-relaxed max-w-md mx-auto font-medium">
                This account does not belong to IIT Madras. Sign in with your official study
                email address{' '}
                <span className="font-mono font-bold bg-[#FFE873] px-2 py-0.5 rounded border border-black text-black">
                  @xx.study.iitm.ac.in
                </span>
                .
              </p>
            )}

            {activeEmail && (
              <p className="text-micro font-mono bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg border-2 border-black dark:border-white inline-block break-all font-bold">
                {activeEmail}
              </p>
            )}
          </div>

          {isIITM ? (
            requestSubmitted ? (
              <div className="p-5 rounded-2xl bg-[#86EFAC] border-2 border-black shadow-[3px_3px_0px_#121212] text-black space-y-3 text-left">
                <h2 className="flex items-center gap-2 font-display font-black text-caption text-black">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />
                  Request sent to house management
                </h2>
                <p className="text-micro text-black/80 font-medium leading-relaxed">
                  Your request for{' '}
                  <span className="font-mono font-bold text-black break-all">{activeEmail}</span> has been
                  delivered. You will be able to sign in once it is approved.
                </p>
                <p className="text-micro text-black/70 font-medium leading-relaxed pt-3 border-t-2 border-black">
                  Approval requires an active student ID, enrolment in the BS Degree Programme,
                  and Kaziranga House membership.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#181818] border-2 border-black dark:border-white shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#ffffff] space-y-3 text-left">
                <h2 className="flex items-center gap-2 font-display font-black text-caption text-black dark:text-white">
                  <HelpCircle className="w-5 h-5 shrink-0 text-black dark:text-white" aria-hidden />
                  How to request access
                </h2>
                <ul className="space-y-2 text-micro text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  <li className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#FFE873] border-2 border-black text-black font-black text-[10px] grid place-items-center shrink-0" aria-hidden>
                      1
                    </span>
                    <span>Access is granted only to active BS Degree students in Kaziranga House.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#5EEAD4] border-2 border-black text-black font-black text-[10px] grid place-items-center shrink-0" aria-hidden>
                      2
                    </span>
                    <span>Send a verification request to house management using the button below.</span>
                  </li>
                </ul>
              </div>
            )
          ) : (
            <div className="p-5 rounded-2xl bg-[#FFA0A0] border-2 border-black shadow-[3px_3px_0px_#121212] text-black space-y-2 text-left">
              <h2 className="flex items-center gap-2 font-display font-black text-caption text-black">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden />
                Non-IITM account detected
              </h2>
              <p className="text-micro text-black/80 font-medium leading-relaxed">
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
            >
              Back to sign in
            </Button>

            {isIITM && !requestSubmitted && (
              <Button
                variant="primary"
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
                className="p-3.5 rounded-xl bg-[#FFA0A0] text-black border-2 border-black shadow-[2px_2px_0px_#121212] font-bold text-caption"
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
