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
        <div className="p-3.5 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-signal-warn text-caption flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-signal-warn shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Authoritative Active-User Source Policy:</span>
            <p className="leading-relaxed">
              Confirming this synchronization will set the active allowed-user whitelist to the
              verified IITM emails below. Users absent from this file will lose login access, but
              their profiles and historical event registrations are <strong>safely retained</strong>
              .
            </p>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-signal-live/10 border border-signal-live/25">
            <div className="text-xl font-display font-black text-signal-live">
              {result.validRows.length}
            </div>
            <div className="text-micro text-signal-live uppercase tracking-wider font-bold mt-0.5">
              Valid IITM Emails
            </div>
          </div>

          <div className="p-3 rounded-xl bg-signal-warn/10 border border-signal-warn/25">
            <div className="text-xl font-display font-black text-signal-warn">
              {result.duplicateCount}
            </div>
            <div className="text-micro text-signal-warn uppercase tracking-wider font-bold mt-0.5">
              Duplicates Cleaned
            </div>
          </div>

          <div className="p-3 rounded-xl bg-signal-danger/10 border border-signal-danger/25">
            <div className="text-xl font-display font-black text-signal-danger">
              {result.invalidRows.length}
            </div>
            <div className="text-micro text-signal-danger uppercase tracking-wider font-bold mt-0.5">
              Invalid Excluded
            </div>
          </div>
        </div>

        {/* Invalid Rows Table if present */}
        {result.invalidRows.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="font-display font-bold text-signal-danger flex items-center justify-between text-caption">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Non-IITM / Invalid Entries Excluded ({result.invalidRows.length})</span>
              </span>
              <span className="text-micro font-normal text-signal-danger">
                Skipped from active whitelist
              </span>
            </h4>
            <div className="max-h-36 overflow-y-auto border border-signal-danger/25 rounded-xl p-2.5 bg-signal-danger/10 text-caption divide-y divide-signal-danger/25">
              {result.invalidRows.map((inv, i) => (
                <div key={i} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-ink truncate max-w-xs">
                    Row {inv.row}: &quot;{inv.email}&quot;
                  </span>
                  <span className="text-signal-danger font-semibold shrink-0">{inv.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Valid Email Preview */}
        <div className="space-y-1.5 pt-1">
          <h4 className="font-display font-bold text-ink text-caption">
            Sample Valid Whitelisted Emails ({result.validRows.length})
          </h4>
          <div className="max-h-28 overflow-y-auto border border-hairline rounded-xl p-2.5 bg-surface-sunken text-caption font-mono space-y-1">
            {result.validRows.slice(0, 8).map((email, idx) => (
              <div key={idx} className="text-ink-muted">
                • {email}
              </div>
            ))}
            {result.validRows.length > 8 && (
              <div className="text-ink-faint font-sans italic pt-1 text-caption">
                ...and {result.validRows.length - 8} more emails
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
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
