'use client';

import { RawCSVRow } from '@/lib/types';

interface Props {
  fileName: string;
  headers: string[];
  rows: RawCSVRow[];
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  progressLabel?: string | null;
}

export default function PreviewStep({
  fileName,
  headers,
  rows,
  onConfirm,
  onCancel,
  isSubmitting,
  progressLabel,
}: Props) {
  const previewRows = rows.slice(0, 200);

  if (isSubmitting) {
    return (
      <div className="mx-auto max-w-2xl glass-card p-10 text-center relative overflow-hidden mt-6">
        <div className="absolute top-0 left-0 w-full h-1.5 progress-animated"></div>
        
        <div className="mb-8 flex justify-center">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 pulse-glow">
            {/* Spinning Radar circles */}
            <div className="absolute inset-0 rounded-2xl border border-indigo-500/20 animate-ping"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold tracking-tight mb-2" style={{ color: 'var(--ink)' }}>
          {progressLabel || 'Clearing Manifest...'}
        </h3>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'var(--ink-soft)' }}>
          The GrowEasy AI-powered pipeline is reading columns, matching statuses, and standardizing data to the CRM.
        </p>

        {/* Progress steps list */}
        <div className="space-y-4 max-w-sm mx-auto text-left border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
          <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Uploaded CSV manifest successfully
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Parsed {rows.length} rows on client
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
            AI mapping & batch compliance scanning
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-400 dark:text-zinc-600">
            <div className="h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-800 shrink-0"></div>
            Final schema validation & skip enforcement
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Unverified Manifest</p>
          <p className="mt-1 font-mono text-xs" style={{ color: 'var(--ink-soft)' }}>
            {fileName} · {rows.length} rows detected · no AI applied yet
          </p>
        </div>
      </div>

      <div className="ledger-wrapper max-h-[420px] overflow-auto">
        <table className="ledger">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-zinc-600 dark:text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                {headers.map((h) => (
                  <td key={h}>
                    {row[h]?.trim() ? (
                      row[h]
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 font-mono">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > previewRows.length && (
        <p className="mt-3 font-mono text-xs" style={{ color: 'var(--ink-soft)' }}>
          Showing first {previewRows.length} of {rows.length} rows. All rows will be
          sent for clearance.
        </p>
      )}

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
        <button onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Confirm & Send for Clearance
        </button>
      </div>
    </div>
  );
}
