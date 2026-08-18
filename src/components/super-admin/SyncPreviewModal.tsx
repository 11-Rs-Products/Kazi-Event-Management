'use client';

import React, { useState } from 'react';
import { SpreadsheetParseResult } from '@/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw, Layers, UserPlus, UserCheck, UserX } from 'lucide-react';

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Allowed-User Synchronization"
      subtitle={`Parsed spreadsheet: ${filename}`}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Warning Alert Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Authoritative Active-User Source Policy:</span>
            <p className="leading-relaxed">
              Confirming this synchronization will set the active allowed-user whitelist to the verified IITM emails below.
              Users absent from this file will lose login access, but their profiles and historical event registrations are <strong>safely retained</strong>.
            </p>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="text-xl font-display font-black text-emerald-700 dark:text-emerald-400">
              {result.validRows.length}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-bold mt-0.5">
              Valid IITM Emails
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
            <div className="text-xl font-display font-black text-amber-700 dark:text-amber-400">
              {result.duplicateCount}
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-300 uppercase tracking-wider font-bold mt-0.5">
              Duplicates Cleaned
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60">
            <div className="text-xl font-display font-black text-rose-700 dark:text-rose-400">
              {result.invalidRows.length}
            </div>
            <div className="text-[10px] text-rose-700 dark:text-rose-300 uppercase tracking-wider font-bold mt-0.5">
              Invalid Excluded
            </div>
          </div>
        </div>

        {/* Invalid Rows Table if present */}
        {result.invalidRows.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="font-display font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Non-IITM / Invalid Entries Excluded ({result.invalidRows.length})</span>
              </span>
              <span className="text-[10px] font-normal text-rose-500">Skipped from active whitelist</span>
            </h4>
            <div className="max-h-36 overflow-y-auto border border-rose-200/60 dark:border-rose-900/60 rounded-xl p-2.5 bg-rose-50/50 dark:bg-rose-950/20 text-[11px] divide-y divide-rose-200/40 dark:divide-rose-900/40">
              {result.invalidRows.map((inv, i) => (
                <div key={i} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-kaziranga-800 dark:text-cream-200 truncate max-w-xs">
                    Row {inv.row}: &quot;{inv.email}&quot;
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold shrink-0">{inv.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Valid Email Preview */}
        <div className="space-y-1.5 pt-1">
          <h4 className="font-display font-bold text-kaziranga-800 dark:text-cream-100 text-xs">
            Sample Valid Whitelisted Emails ({result.validRows.length})
          </h4>
          <div className="max-h-28 overflow-y-auto border border-cream-400/20 dark:border-kaziranga-800 rounded-xl p-2.5 bg-cream-200/30 dark:bg-kaziranga-900/30 text-[11px] font-mono space-y-1">
            {result.validRows.slice(0, 8).map((email, idx) => (
              <div key={idx} className="text-kaziranga-700 dark:text-cream-300">
                • {email}
              </div>
            ))}
            {result.validRows.length > 8 && (
              <div className="text-kaziranga-500 dark:text-cream-400/50 font-sans italic pt-1 text-[11px]">
                ...and {result.validRows.length - 8} more emails
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
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
