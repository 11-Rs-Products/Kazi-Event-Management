'use client';

import React, { useState } from 'react';
import { SpreadsheetParseResult } from '@/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  UserPlus,
  UserCheck,
  UserX,
} from 'lucide-react';

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
      <div className="space-y-4 text-caption sm:text-sm">
        {/* Warning Alert Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FFE873] text-black border-2 border-black shadow-[2px_2px_0px_#121212] text-caption flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
          <div className="space-y-1">
            <span className="font-black font-display uppercase tracking-wider">Authoritative Active-User Source Policy:</span>
            <p className="leading-relaxed font-medium">
              Confirming this synchronization will set the active allowed-user whitelist to the
              verified IITM emails below. Users absent from this file will lose login access, but
              their profiles and historical event registrations are <strong>safely retained</strong>.
            </p>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-[#5EEAD4]/25 border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] text-black dark:text-white">
            <div className="text-xl font-display font-black text-black dark:text-white">
              {result.validRows.length}
            </div>
            <div className="text-micro text-black/70 dark:text-white/70 uppercase tracking-wider font-black mt-0.5">
              Valid IITM Emails
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFE873]/30 border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] text-black dark:text-white">
            <div className="text-xl font-display font-black text-black dark:text-white">
              {result.duplicateCount}
            </div>
            <div className="text-micro text-black/70 dark:text-white/70 uppercase tracking-wider font-black mt-0.5">
              Duplicates Cleaned
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFA0A0]/40 border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] text-black dark:text-white">
            <div className="text-xl font-display font-black text-black dark:text-white">
              {result.invalidRows.length}
            </div>
            <div className="text-micro text-black/70 dark:text-white/70 uppercase tracking-wider font-black mt-0.5">
              Invalid Excluded
            </div>
          </div>
        </div>

        {/* Invalid Rows Table if present */}
        {result.invalidRows.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="font-display font-black text-signal-danger flex items-center justify-between text-caption">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Non-IITM / Invalid Entries Excluded ({result.invalidRows.length})</span>
              </span>
              <span className="text-micro font-bold text-signal-danger">
                Skipped from active whitelist
              </span>
            </h4>
            <div className="max-h-36 overflow-y-auto border-2 border-black dark:border-white rounded-2xl p-2.5 bg-[#FFA0A0]/20 text-caption divide-y-2 divide-black/10 dark:divide-white/20 shadow-[2px_2px_0px_#121212]">
              {result.invalidRows.map((inv, i) => (
                <div key={i} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-ink truncate max-w-xs font-bold">
                    Row {inv.row}: &quot;{inv.email}&quot;
                  </span>
                  <span className="text-signal-danger font-black shrink-0">{inv.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Valid Email Preview */}
        <div className="space-y-1.5 pt-1">
          <h4 className="font-display font-black text-ink text-caption">
            Sample Valid Whitelisted Emails ({result.validRows.length})
          </h4>
          <div className="max-h-28 overflow-y-auto border-2 border-black dark:border-white rounded-2xl p-3 bg-surface-sunken text-caption font-mono space-y-1 shadow-[2px_2px_0px_#121212]">
            {result.validRows.slice(0, 8).map((email, idx) => (
              <div key={idx} className="text-ink font-medium">
                • {email}
              </div>
            ))}
            {result.validRows.length > 8 && (
              <div className="text-ink-faint font-sans italic pt-1 text-caption font-bold">
                ...and {result.validRows.length - 8} more emails
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black dark:border-white">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
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
