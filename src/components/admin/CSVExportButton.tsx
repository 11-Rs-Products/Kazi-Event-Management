'use client';

import React, { useState } from 'react';
import { Registration } from '@/types';
import { convertRegistrationsToCSV, downloadCsvFile } from '@/lib/utils/exportCsv';
import { Button } from '../ui/Button';
import { Download, FileSpreadsheet } from 'lucide-react';

interface CSVExportButtonProps {
  registrations: Registration[];
  eventTitle?: string;
  filename?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'gold';
  size?: 'sm' | 'md';
}

export const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  registrations,
  eventTitle,
  filename = 'kaziranga_registrations.csv',
  variant = 'secondary',
  size = 'md',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const csv = convertRegistrationsToCSV(registrations, eventTitle);
      const cleanFilename = eventTitle
        ? `kaziranga_${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`
        : filename;
      downloadCsvFile(csv, cleanFilename);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to generate CSV export');
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
