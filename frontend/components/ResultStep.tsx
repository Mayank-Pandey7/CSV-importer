'use client';

import { useState } from 'react';
import { CRM_COLUMNS, ImportResult } from '@/lib/types';

interface Props {
  result: ImportResult;
  onStartOver: () => void;
}

const STATUS_STAMP: Record<string, string> = {
  SALE_DONE: 'stamp-approved',
  GOOD_LEAD_FOLLOW_UP: 'stamp-accent',
  DID_NOT_CONNECT: 'stamp-neutral',
  BAD_LEAD: 'stamp-returned',
};

export default function ResultStep({ result, onStartOver }: Props) {
  const [tab, setTab] = useState<'imported' | 'skipped'>('imported');

  // Math for circular progress gauges
  const total = result.totalRows || 1;
  const clearedPercentage = Math.round((result.totalImported / total) * 100);
  const skippedPercentage = Math.round((result.totalSkipped / total) * 100);

  // Circumference for r=18 circle is 113
  const strokeCircumference = 113;
  const clearedDashoffset = strokeCircumference - (strokeCircumference * clearedPercentage) / 100;
  const skippedDashoffset = strokeCircumference - (strokeCircumference * skippedPercentage) / 100;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Tally Strip Dashboard Cards with Circular Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Received Card */}
        <div className="tally-cell flex items-center justify-between">
          <div>
            <p className="tally-label">Rows Received</p>
            <p className="tally-value">{result.totalRows}</p>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-2">Total inputs loaded</p>
          </div>
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full" viewBox="0 0 40 40">
              <circle className="text-zinc-200 dark:text-zinc-800" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
              <circle className="text-indigo-600 dark:text-indigo-400" strokeWidth="3" strokeDasharray={strokeCircumference} strokeDashoffset={0} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">100%</div>
          </div>
        </div>

        {/* Mapped / Cleared Card */}
        <div className="tally-cell flex items-center justify-between">
          <div>
            <p className="tally-label" style={{ color: 'var(--approved)' }}>Cleared (Imported)</p>
            <p className="tally-value" style={{ color: 'var(--approved)' }}>{result.totalImported}</p>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-2">Mapped to CRM fields</p>
          </div>
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full" viewBox="0 0 40 40">
              <circle className="text-zinc-200 dark:text-zinc-800" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
              <circle className="text-emerald-500 progress-ring-circle" strokeWidth="3" strokeDasharray={strokeCircumference} strokeDashoffset={clearedDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono" style={{ color: 'var(--approved)' }}>
              {clearedPercentage}%
            </div>
          </div>
        </div>

        {/* Returned / Skipped Card */}
        <div className="tally-cell flex items-center justify-between">
          <div>
            <p className="tally-label" style={{ color: 'var(--returned)' }}>Returned (Skipped)</p>
            <p className="tally-value" style={{ color: 'var(--returned)' }}>{result.totalSkipped}</p>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-2">Lacked email/phone</p>
          </div>
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full" viewBox="0 0 40 40">
              <circle className="text-zinc-200 dark:text-zinc-800" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
              <circle className="text-red-500 progress-ring-circle" strokeWidth="3" strokeDasharray={strokeCircumference} strokeDashoffset={skippedDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono" style={{ color: 'var(--returned)' }}>
              {skippedPercentage}%
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Filter Container */}
      <div className="flex justify-between items-center mb-4">
        <div className="tabs-container">
          <button
            onClick={() => setTab('imported')}
            className={`tab-btn ${tab === 'imported' ? 'active' : ''}`}
          >
            Cleared Ledger ({result.totalImported})
          </button>
          <button
            onClick={() => setTab('skipped')}
            className={`tab-btn ${tab === 'skipped' ? 'active' : ''}`}
          >
            Returned Log ({result.totalSkipped})
          </button>
        </div>
      </div>

      {/* Mapped Ledger Table View */}
      {tab === 'imported' ? (
        <div className="ledger-wrapper max-h-[480px] overflow-auto">
          <table className="ledger">
            <thead>
              <tr>
                {CRM_COLUMNS.map((col) => (
                  <th key={col} className="text-zinc-600 dark:text-zinc-400">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.imported.length > 0 ? (
                result.imported.map((rec, i) => (
                  <tr key={i}>
                    {CRM_COLUMNS.map((col) => (
                      <td
                        key={col}
                        className="max-w-[220px] truncate"
                        title={String(rec[col] ?? '')}
                      >
                        {col === 'crm_status' && rec[col] ? (
                          <span className={`stamp ${STATUS_STAMP[rec[col]] || 'stamp-neutral'}`}>
                            {rec[col]}
                          </span>
                        ) : (
                          rec[col] || <span className="text-zinc-300 dark:text-zinc-700 font-mono">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={CRM_COLUMNS.length} className="text-center py-12 text-zinc-400 font-medium">
                    No rows were cleared for import.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Returned List Table View */
        <div className="ledger-wrapper max-h-[480px] overflow-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th className="w-1/3 text-zinc-600 dark:text-zinc-400">Reason Returned</th>
                <th className="w-2/3 text-zinc-600 dark:text-zinc-400">Original Row Object</th>
              </tr>
            </thead>
            <tbody>
              {result.skipped.length > 0 ? (
                result.skipped.map((s, i) => (
                  <tr key={i}>
                    <td className="align-top py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="stamp stamp-returned w-fit">Returned</span>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                          {s.reason}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-900 p-3 rounded-lg max-h-[140px] overflow-auto">
                        <pre className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap word-break-all leading-relaxed">
                          {JSON.stringify(s.row, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center py-12 text-zinc-400 font-medium">
                    No rows were returned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Start Over Button Section */}
      <div className="mt-8 flex justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
        <button onClick={onStartOver} className="btn-primary whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
          </svg>
          <span>Process Another Manifest</span>
        </button>
      </div>
    </div>
  );
}
