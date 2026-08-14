'use client';

import React, { useState } from 'react';
import { SpreadsheetParseResult } from '@/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface SyncPreviewModalProps {
  isOpen: boolean;
  result: SpreadsheetParseResult | null;
  filename: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const SyncPreviewModal: React.FC<SyncPreviewModalProps> = ({
  isOpen,
  result,
  filename,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!result) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Replacement sync failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allowed User Synchronization Preview"
      subtitle={filename}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Preservation Guarantee Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-xs">Data Preservation Guarantee</div>
            <p className="text-[11px] leading-relaxed">
              Replacing the active allowed-user list will update portal access eligibility for new logins. Existing student profiles, historical event registrations, and event definitions remain completely safe and will <strong>NOT</strong> be deleted.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 border border-kaziranga-100 dark:border-kaziranga-800">
            <div className="text-xl font-black text-kaziranga-800 dark:text-kaziranga-200">
              {result.validRows.length}
            </div>
            <div className="text-[10px] text-kaziranga-500 uppercase tracking-wider font-semibold mt-0.5">
              Valid Emails
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">
              {result.duplicateCount}
            </div>
            <div className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold mt-0.5">
              Duplicates Deduplicated
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
            <div className="text-xl font-black text-rose-700 dark:text-rose-300">
              {result.invalidRows.length}
            </div>
            <div className="text-[10px] text-rose-600 uppercase tracking-wider font-semibold mt-0.5">
              Invalid Rows Ignored
            </div>
          </div>
        </div>

        {/* Invalid Rows Table if present */}
        {result.invalidRows.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Invalid Row Details (Will be excluded)</span>
            </h4>
            <div className="max-h-36 overflow-y-auto border border-rose-200 dark:border-rose-900 rounded-xl p-2 bg-rose-50/50 dark:bg-rose-950/20 text-[11px] divide-y divide-rose-200 dark:divide-rose-900">
              {result.invalidRows.map((inv, i) => (
                <div key={i} className="py-1 flex items-center justify-between">
                  <span>Row {inv.row}: &quot;{inv.email}&quot;</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">{inv.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Valid Email Preview */}
        <div className="space-y-1.5 pt-2">
          <h4 className="font-bold text-kaziranga-950 dark:text-white">Sample Valid Emails to Import ({result.validRows.length})</h4>
          <div className="max-h-28 overflow-y-auto border border-kaziranga-100 dark:border-kaziranga-800 rounded-xl p-2.5 bg-kaziranga-50/40 dark:bg-kaziranga-900/30 text-[11px] font-mono space-y-0.5">
            {result.validRows.slice(0, 8).map((email, idx) => (
              <div key={idx} className="text-kaziranga-700 dark:text-kaziranga-300">
                • {email}
              </div>
            ))}
            {result.validRows.length > 8 && (
              <div className="text-kaziranga-400 font-sans italic pt-1">
                ...and {result.validRows.length - 8} more emails
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="gold"
            isLoading={isSubmitting}
            onClick={handleConfirm}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Confirm & Replace Allowed List
          </Button>
        </div>
      </div>
    </Modal>
  );
};
