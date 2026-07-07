'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import UploadStep from '@/components/UploadStep';
import PreviewStep from '@/components/PreviewStep';
import ResultStep from '@/components/ResultStep';
import { ImportResult, RawCSVRow, Step } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawCSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  function handleFileAccepted(selected: File) {
    setError(null);
    setFile(selected);

    Papa.parse<RawCSVRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setError('This CSV appears to be empty.');
          return;
        }
        setHeaders(results.meta.fields || Object.keys(results.data[0]));
        setRows(results.data);
        setStep('preview');
      },
      error: (err) => setError(`Failed to parse CSV: ${err.message}`),
    });
  }

  async function handleConfirm() {
    if (!file) return;
    setIsSubmitting(true);
    setProgressLabel('Uploading…');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgressLabel('AI is reading each row…');
      const res = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Import failed (${res.status})`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong during import.');
    } finally {
      setIsSubmitting(false);
      setProgressLabel(null);
    }
  }

  function handleStartOver() {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setError(null);
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <main className="min-h-screen px-6 py-12 relative overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--paper)' }}>
        {/* Decorative Background Glows */}
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>

        <div className="mx-auto mb-10 flex max-w-6xl items-start justify-between">
          <div>
            <p className="eyebrow">GrowEasy · CRM Data Intake</p>
            <h1 className="headline mt-2">CSV Importer</h1>
            <p className="subhead mt-3">
              Drop any lead export — Facebook, Google Ads, a rep&apos;s own
              spreadsheet — and the ledger sorts itself into clean CRM records.
            </p>
          </div>
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="theme-switch-btn shrink-0"
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="mx-auto mb-12 flex max-w-xl justify-between items-center relative px-2">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute left-2 top-1/2 h-[2px] bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: step === 'upload' ? '0%' : step === 'preview' ? '50%' : '96%'
            }}
          ></div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step === 'upload' 
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 scale-110 shadow-lg' 
                : 'bg-indigo-600 text-white'
            }`}>
              1
            </div>
            <span className="text-[9px] uppercase font-mono mt-2 tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Upload</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step === 'preview'
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 scale-110 shadow-lg'
                : step === 'result'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            }`}>
              2
            </div>
            <span className="text-[9px] uppercase font-mono mt-2 tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Verify</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step === 'result'
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 scale-110 shadow-lg'
                : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            }`}>
              3
            </div>
            <span className="text-[9px] uppercase font-mono mt-2 tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Cleared</span>
          </div>
        </div>

        <div className="fade-in">
          {step === 'upload' && <UploadStep onFileAccepted={handleFileAccepted} error={error} />}

          {step === 'preview' && file && (
            <>
              <PreviewStep
                fileName={file.name}
                headers={headers}
                rows={rows}
                onConfirm={handleConfirm}
                onCancel={handleStartOver}
                isSubmitting={isSubmitting}
                progressLabel={progressLabel}
              />
              {error && (
                <p className="mx-auto mt-4 max-w-5xl text-center text-sm font-medium" style={{ color: 'var(--returned)' }}>
                  {error}
                </p>
              )}
            </>
          )}

          {step === 'result' && result && <ResultStep result={result} onStartOver={handleStartOver} />}
        </div>
      </main>
    </div>
  );
}
