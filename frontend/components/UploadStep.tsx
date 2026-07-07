'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFileAccepted: (file: File) => void;
  error?: string | null;
}

export default function UploadStep({ onFileAccepted, error }: Props) {
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setRejectMsg(null);
      if (rejected.length > 0) {
        setRejectMsg('Only .csv files under 5MB are accepted.');
        return;
      }
      if (accepted[0]) {
        onFileAccepted(accepted[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div 
        {...getRootProps()} 
        className={`intake-slot cursor-pointer text-center relative group transition-all duration-300 ${
          isDragActive ? 'active border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 scale-[1.01]' : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
        <input {...getInputProps()} />

        {/* Dynamic Glowing Upload/Scan Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 relative">
          {isDragActive ? (
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping"></div>
          ) : null}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-8 w-8 transition-transform duration-300 ${isDragActive ? 'translate-y-[-2px] animate-bounce' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <p className="eyebrow mb-3">{isDragActive ? 'Release to Scan' : 'Awaiting Manifest'}</p>
        <p className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
          {isDragActive ? 'Drop the file here' : 'Select your CSV file'}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
          {isDragActive ? 'Scanning system is ready' : 'Drag & drop it, or click to browse'}
        </p>
        
        <div className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm12 1a1 1 0 10-2 0v2H8V6a1 1 0 00-2 0v6a3 3 0 006 0V9h2V6z" clipRule="evenodd" />
          </svg>
          CSV file format up to 5MB
        </div>
      </div>

      {(rejectMsg || error) && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {rejectMsg || error}
        </div>
      )}

      {/* Modern Badge Indicators of Accepted Source Formats */}
      <div className="mt-8 text-center">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Compatible Layouts Include</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {['Facebook Ads', 'Google Lead Form', 'Excel Sheets', 'Sales Reports', 'Custom CRM Exports'].map((badge) => (
            <span key={badge} className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded bg-zinc-100/80 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/30">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
