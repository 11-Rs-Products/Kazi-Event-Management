import { Registration } from '@/types';

export function convertRegistrationsToCSV(registrations: Registration[], eventTitle?: string): string {
  const headers = [
    'Registration ID',
    'Event Name',
    'Student Name',
    'Email',
    'Phone',
    'Region',
    'Level',
    'Programme',
    'Registration Type',
    'Status',
    'Registered At',
  ];

  const rows = registrations.map((reg) => [
    sanitizeCsvField(reg.id),
    sanitizeCsvField(reg.eventTitle || eventTitle || 'N/A'),
    sanitizeCsvField(reg.nameSnapshot),
    sanitizeCsvField(reg.emailSnapshot),
    sanitizeCsvField(reg.phoneSnapshot),
    sanitizeCsvField(reg.regionSnapshot),
    sanitizeCsvField(reg.levelSnapshot),
    sanitizeCsvField(reg.programmeSnapshot),
    sanitizeCsvField(reg.registrationType),
    sanitizeCsvField(reg.status),
    sanitizeCsvField(new Date(reg.createdAt).toLocaleString()),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

function sanitizeCsvField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field);

  // Prevent CSV injection vulnerabilities (formula injection with =, +, -, @)
  let clean = str;
  if (/^[=+\-@\t\r]/.test(clean)) {
    clean = "'" + clean;
  }

  // Escape double quotes and wrap in quotes
  return `"${clean.replace(/"/g, '""')}"`;
}

export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
