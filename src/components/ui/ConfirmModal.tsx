'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { cn } from '@/lib/utils/cn';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const variantMeta = {
  danger: {
    Icon: AlertCircle,
    tone: 'bg-signal-danger/10 text-signal-danger border-signal-danger/25',
    button: 'danger' as const,
  },
  warning: {
    Icon: AlertTriangle,
    tone: 'bg-signal-warn/10 text-signal-warn border-signal-warn/25',
    button: 'primary' as const,
  },
  primary: {
    Icon: Info,
    tone: 'bg-brand-soft text-brand border-brand/25',
    button: 'primary' as const,
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const { Icon, tone, button } = variantMeta[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      title={title}
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={button} size="md" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span
          className={cn('grid place-items-center w-11 h-11 rounded-2xl border shrink-0', tone)}
          aria-hidden
        >
          <Icon className="w-5 h-5" />
        </span>
        <p className="text-body text-ink-muted leading-relaxed pt-1.5">{message}</p>
      </div>
    </Modal>
  );
};
