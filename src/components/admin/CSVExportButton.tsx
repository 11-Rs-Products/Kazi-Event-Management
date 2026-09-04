'use client';

import React, { useState } from 'react';
import { Registration } from '@/types';
import { convertRegistrationsToCSV, downloadCsvFile } from '@/lib/utils/exportCsv';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface CSVExportButtonProps {
  registrations: Registration[];
  eventTitle?: string;
  filename?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  registrations,
  eventTitle,
  filename = 'kaziranga_registrations.csv',
  variant = 'secondary',
  size = 'md',
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
      leftIcon={<Download className="w-4 h-4" />}
    >
      Export CSV ({registrations.length})
    </Button>
  );
};
