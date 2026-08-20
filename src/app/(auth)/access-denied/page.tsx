'use client';

import React, { useState } from 'react';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-kaziranga-950 via-kaziranga-900 to-kaziranga-950 text-white selection:bg-gold-500 selection:text-kaziranga-950 overflow-hidden relative">
      {/* Background Soft Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Centered Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-lg px-8 py-10 sm:px-10 sm:py-12 rounded-3xl bg-kaziranga-950/85 backdrop-blur-2xl border border-rose-900/50 shadow-2xl text-center space-y-6 flex flex-col items-center justify-center">
        
        {/* Kaziranga Logo Seal */}
        <div className="space-y-3 flex flex-col items-center">
          <KazirangaLogo variant="iconOnly" size="xl" className="mx-auto" />
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase">
              KAZIRANGA <span className="text-gold-400 font-light">HOUSE</span>
            </h1>
            <div className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-kaziranga-300">
              INTRA-HOUSE EVENT PORTAL
            </div>
          </div>
        </div>

        {/* Access Denied Warning Badge */}
        <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-display font-black text-rose-200 tracking-tight">
            Access Denied
          </h2>
          {isIITM ? (
            <p className="text-xs sm:text-sm text-kaziranga-200/90 leading-relaxed max-w-md mx-auto">
              Your email address is not currently listed in the official <span className="font-bold text-white">Kaziranga House Member Registry</span>.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed max-w-md mx-auto">
              This email account does not belong to IIT Madras. Please sign in using your official IITM study email address (<span className="font-mono text-gold-400 font-bold">@xx.study.iitm.ac.in</span>).
            </p>
          )}
        </div>

        {/* Dynamic Details / Status Box */}
        {isIITM ? (
          requestSubmitted ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 space-y-2 text-left animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>Access Request Sent to Kaziranga House Management!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-200/90">
                Your access request for <span className="font-mono text-white font-bold">{activeEmail}</span> has been delivered directly to Kaziranga House Management. You will be able to sign in once approved.
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-200/80 border-t border-emerald-900/60 pt-2">
                <span className="font-bold text-gold-400">Note:</span> Access approval is granted only if your student ID is active, you are enrolled in the BS Degree Program, and belong to Kaziranga House.
              </p>
            </div>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-kaziranga-900/80 border border-kaziranga-800 text-xs text-kaziranga-200 space-y-2 text-left">
              <div className="font-bold flex items-center gap-2 text-gold-400">
                <HelpCircle className="w-4 h-4 text-gold-400 shrink-0" />
                <span>How to request access?</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] leading-relaxed text-kaziranga-200/90">
                <li>Access is granted only to active students in the BS Degree Program belonging to Kaziranga House.</li>
                <li>
                  Click <span className="font-bold text-white">&quot;Request Access&quot;</span> below to send a verification request to Kaziranga House Management.
                </li>
              </ul>
            </div>
          )
        ) : (
          <div className="w-full p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-2 text-left">
            <div className="font-bold flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Non-IITM Account Detected</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200/80">
              Personal or third-party email accounts (e.g. Gmail, Yahoo, Hotmail) cannot request access to the Kaziranga House Event Portal.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => logout()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto text-white border-kaziranga-600/80 hover:bg-kaziranga-800/80 hover:border-kaziranga-500 shadow-sm font-bold"
          >
            Back to Login
          </Button>

          {isIITM && !requestSubmitted && (
            <Button
              variant="gold"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Request Access
            </Button>
          )}
        </div>
      </div>

      {/* Access Request Submission Modal */}
      {isIITM && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Submit Access Request"
        >
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300">
              Submit your student email address below. A notification will be sent directly to the Management to verify and grant access.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-kaziranga-950 dark:text-white">
                Student Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                readOnly
                disabled
                value={activeEmail}
                className="arena-input font-mono opacity-80 cursor-not-allowed"
              />
              <span className="text-[10px] text-kaziranga-500">Automatically populated from your authenticated Google account identity.</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-kaziranga-950 dark:text-white">
                Note for Management <span className="text-kaziranga-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Student Name, Region or any relevant details..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="arena-input resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cream-400/20 dark:border-kaziranga-800">
              <Button
                type="submit"
                variant="gold"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
