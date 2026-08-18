'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SpreadsheetParseResult } from '@/types';
import { allowedUserEmailSchema } from '@/lib/validation/schemas';
import { Upload, FileSpreadsheet, AlertCircle, X, CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface SpreadsheetUploaderProps {
  onParsed: (result: SpreadsheetParseResult, filename: string) => void;
}

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({ onParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = (file: File) => {
    setError(null);
    setIsProcessing(true);
    setSelectedFile(file);

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
      reader.onerror = () => {
        setError('Error reading Excel spreadsheet file.');
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.');
      setIsProcessing(false);
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processParsedRows = (rows: any[], filename: string) => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Spreadsheet appears to be empty. Please verify the file contains rows.');
      }

      // Look for Email column (case-insensitive)
      const firstRow = rows[0];
      const emailKey = Object.keys(firstRow).find(
        (key) => key.trim().toLowerCase() === 'email'
      );

      if (!emailKey) {
        throw new Error('Could not find an "Email" column in the uploaded spreadsheet. Please ensure the header has an "Email" column.');
      }

      const validEmailSet = new Set<string>();
      const invalidRows: { row: number; email: string; reason: string }[] = [];
      let duplicateCount = 0;

      rows.forEach((row, idx) => {
        const rawVal = row[emailKey];
        if (!rawVal || typeof rawVal !== 'string') {
          invalidRows.push({
            row: idx + 2,
            email: String(rawVal || ''),
            reason: 'Empty or non-string value in Email column',
          });
          return;
        }

        const trimmed = rawVal.trim().toLowerCase();
        const validation = allowedUserEmailSchema.safeParse(trimmed);

        if (!validation.success) {
          const reason = !trimmed.includes('@')
            ? 'Invalid email format'
            : !trimmed.endsWith('study.iitm.ac.in')
            ? 'Non-IITM domain (must end with study.iitm.ac.in)'
            : 'Invalid IITM study email';
          invalidRows.push({ row: idx + 2, email: rawVal, reason });
          return;
        }

        if (validEmailSet.has(trimmed)) {
          duplicateCount++;
        } else {
          validEmailSet.add(trimmed);
        }
      });

      const validRows = Array.from(validEmailSet);

      if (validRows.length === 0) {
        throw new Error('No valid IITM student emails (ending with study.iitm.ac.in) found in the spreadsheet.');
      }

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
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center space-y-4 cursor-pointer select-none ${
          isDragOver
            ? 'border-gold-500 bg-gold-500/10 shadow-lg scale-[1.01]'
            : 'border-kaziranga-300 dark:border-kaziranga-700 hover:border-gold-500/60 bg-cream-50/60 dark:bg-kaziranga-900/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-kaziranga-100 dark:bg-kaziranga-800 text-gold-500 flex items-center justify-center mx-auto shadow-inner">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-display font-bold text-kaziranga-800 dark:text-cream-100">
            {isDragOver ? 'Drop spreadsheet here to parse' : 'Upload Allowed-User Spreadsheet'}
          </h3>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 max-w-md mx-auto mt-1">
            Drag & drop a <span className="font-semibold text-kaziranga-800 dark:text-cream-200">.CSV</span> or <span className="font-semibold text-kaziranga-800 dark:text-cream-200">.XLSX</span> file here, or click to browse.
          </p>
        </div>

        {/* Selected File Chip */}
        {selectedFile && (
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-cream-200/80 dark:bg-kaziranga-800 border border-cream-400/30 dark:border-kaziranga-700 text-xs text-kaziranga-800 dark:text-cream-100 animate-fade-in">
            <FileText className="w-4 h-4 text-gold-500 shrink-0" />
            <div className="text-left font-mono">
              <span className="font-bold">{selectedFile.name}</span>
              <span className="text-[10px] text-kaziranga-500 dark:text-cream-400/50 ml-2">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetFile();
              }}
              className="p-1 rounded-lg text-kaziranga-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-2"
              title="Remove or replace file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="gold"
            isLoading={isProcessing}
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {selectedFile ? 'Select Another File' : 'Browse File'}
          </Button>

          {selectedFile && !isProcessing && (
            <Button
              type="button"
              variant="outline"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedFile) handleProcessFile(selectedFile);
              }}
            >
              Re-parse
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
