'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SpreadsheetParseResult } from '@/types';
import { allowedUserEmailSchema } from '@/lib/validation/schemas';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface SpreadsheetUploaderProps {
  onParsed: (result: SpreadsheetParseResult, filename: string) => void;
}

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({ onParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    const filename = file.name;
    const extension = filename.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedRows(results.data, filename);
        },
        error: (err) => {
          setError('Failed to parse CSV file: ' + err.message);
          setIsProcessing(false);
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processParsedRows(data, filename);
        } catch (err: any) {
          setError('Failed to parse Excel file: ' + err.message);
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Unsupported file format. Please upload a CSV or XLSX file.');
      setIsProcessing(false);
    }
  };

  const processParsedRows = (rows: any[], filename: string) => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Spreadsheet appears to be empty.');
      }

      // Look for Email column (case-insensitive)
      const firstRow = rows[0];
      const emailKey = Object.keys(firstRow).find(
        (key) => key.trim().toLowerCase() === 'email'
      );

      if (!emailKey) {
        throw new Error('Could not find an "Email" column in the uploaded spreadsheet.');
      }

      const validEmailSet = new Set<string>();
      const invalidRows: { row: number; email: string; reason: string }[] = [];
      let duplicateCount = 0;

      rows.forEach((row, idx) => {
        const rawVal = row[emailKey];
        if (!rawVal || typeof rawVal !== 'string') {
          invalidRows.push({ row: idx + 2, email: String(rawVal || ''), reason: 'Empty or non-string email' });
          return;
        }

        const trimmed = rawVal.trim().toLowerCase();
        const validation = allowedUserEmailSchema.safeParse(trimmed);

        if (!validation.success) {
          invalidRows.push({ row: idx + 2, email: rawVal, reason: 'Invalid email format' });
          return;
        }

        if (validEmailSet.has(trimmed)) {
          duplicateCount++;
        } else {
          validEmailSet.add(trimmed);
        }
      });

      const validRows = Array.from(validEmailSet);

      const parseResult: SpreadsheetParseResult = {
        validRows,
        invalidRows,
        duplicateCount,
        totalParsed: rows.length,
      };

      setIsProcessing(false);
      onParsed(parseResult, filename);
    } catch (err: any) {
      setError(err.message || 'Error processing spreadsheet data.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-dashed border-kaziranga-300 dark:border-kaziranga-700 bg-kaziranga-50/50 dark:bg-kaziranga-900/30 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-kaziranga-100 dark:bg-kaziranga-800 text-kaziranga-700 dark:text-kaziranga-300 flex items-center justify-center mx-auto">
        <FileSpreadsheet className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-base font-bold text-kaziranga-950 dark:text-white">
          Upload Allowed User Spreadsheet
        </h3>
        <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 max-w-md mx-auto mt-1">
          Upload a CSV or XLSX file containing an <span className="font-semibold text-kaziranga-800 dark:text-kaziranga-200">Email</span> column to synchronize the active access list.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-2">
        <label className="inline-block">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
          />
          <Button
            type="button"
            variant="gold"
            isLoading={isProcessing}
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          >
            Select Spreadsheet File
          </Button>
        </label>
      </div>
    </div>
  );
};
