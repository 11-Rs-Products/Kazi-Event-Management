'use client';

import React, { useState } from 'react';
import { Registration } from '@/types';
import { convertRegistrationsToCSV, downloadCsvFile } from '@/lib/utils/exportCsv';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { cn } from '@/lib/utils/cn';

interface CSVExportButtonProps {
  registrations: Registration[];
  eventTitle?: string;
  filename?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  responsive?: boolean;
}

export const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  registrations,
  eventTitle,
  filename = 'kaziranga_registrations.csv',
  variant = 'secondary',
  size = 'md',
  className,
  responsive = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = () => {
    setIsExporting(true);
    try {
      const csv = convertRegistrationsToCSV(registrations, eventTitle);
      const cleanFilename = eventTitle
        ? `kaziranga_${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`
        : filename;
      downloadCsvFile(csv, cleanFilename);
      toast.success(
        'Export ready',
        `${registrations.length} ${registrations.length === 1 ? 'registration' : 'registrations'} downloaded as CSV.`,
      );
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Export failed', 'Could not generate the CSV file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      isLoading={isExporting}
      leftIcon={<Download className="w-4 h-4 shrink-0" />}
      aria-label={`Export CSV (${registrations.length} registrations)`}
      title={`Export CSV (${registrations.length} registrations)`}
      className={cn(
        'relative h-10 rounded-xl',
        responsive && 'max-sm:w-10 max-sm:h-10 max-sm:p-0 max-sm:gap-0 max-sm:justify-center shrink-0',
        className
      )}
    >
      <span className={cn(responsive && 'hidden sm:inline')}>
        Export CSV ({registrations.length})
      </span>
      {responsive && (
        <span
          className={cn(
            'sm:hidden absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full leading-none font-mono font-bold tracking-tight',
            'text-[0.625rem] flex items-center justify-center select-none shadow-sm',
            'bg-brand text-brand-contrast dark:bg-accent dark:text-slate-950 border border-white/20 dark:border-accent/40'
          )}
          aria-hidden="true"
        >
          {registrations.length}
        </span>
      )}
    </Button>
  );
};
