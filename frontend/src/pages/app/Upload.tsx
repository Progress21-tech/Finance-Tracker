import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, X, Check, AlertTriangle, Loader2, FileSpreadsheet, FileText, Image, ChevronRight } from 'lucide-react';
import { api, PreviewRow } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtCurrency, cap } from '../../lib/format';

type Stage = 'idle' | 'previewing' | 'preview_ready' | 'committing' | 'done' | 'error';

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')  return <FileText size={20} className="text-red-400" />;
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet size={20} className="text-income" />;
  return <Image size={20} className="text-quillio-400" />;
}

export default function Upload() {
  const { user }   = useAuth();
  const currency   = user?.currency ?? 'NGN';
  const dropRef    = useRef<HTMLDivElement>(null);

  const [stage, setStage]           = useState<Stage>('idle');
  const [file, setFile]             = useState<File | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [rows, setRows]             = useState<PreviewRow[]>([]);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [dupCount, setDupCount]     = useState(0);
  const [error, setError]           = useState('');
  const [insertedCount, setInserted] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage('idle'); setFile(null); setRows([]); setSelected(new Set());
    setDupCount(0); setError(''); setInserted(0);
  };

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setStage('previewing');
    setError('');
    try {
      const result = await api.statements.preview(f);
      setRows(result.rows);
      setDupCount(result.duplicateCount);
      setSelected(new Set(result.rows.map((_, i) => i)));
      setStage('preview_ready');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse statement');
      setStage('error');
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  }

  function toggleRow(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function commit() {
    setStage('committing');
    try {
      const toCommit = rows.filter((_, i) => selected.has(i));
      const result = await api.statements.commit(toCommit);
      setInserted(result.inserted);
      setStage('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save transactions');
      setStage('error');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--text)]">Upload statement</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Import a bank statement PDF, CSV, or Excel file. Quillio parses it and lets you review before saving.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Idle drop zone ── */}
        {stage === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              ref={dropRef}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
                ${dragging
                  ? 'border-quillio-500 bg-quillio-500/5 scale-[1.01]'
                  : 'border-[var(--border-strong)] hover:border-quillio-500/50 hover:bg-quillio-500/3 bg-[var(--card)]'}
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-quillio-500/10 flex items-center justify-center">
                <UploadIcon size={26} className="text-quillio-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[var(--text)] mb-1">Drop your statement here</p>
                <p className="text-sm text-[var(--text-muted)]">PDF, CSV, or Excel (.xlsx / .xls) — up to 20 MB</p>
              </div>
              <p className="text-xs text-[var(--text-subtle)]">or click to browse</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={onFileChange} className="hidden" />
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-subtle)]">
              <span className="flex items-center gap-1.5"><FileText size={13} className="text-red-400" /> PDF bank statements</span>
              <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} className="text-income" /> CSV / Excel exports</span>
              <span className="flex items-center gap-1.5"><Check size={13} className="text-quillio-500" /> Duplicates auto-detected</span>
            </div>
          </motion.div>
        )}

        {/* ── Parsing ── */}
        {stage === 'previewing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center">
            <Loader2 size={32} className="animate-spin text-quillio-500" />
            <div>
              <p className="font-semibold text-[var(--text)]">Parsing {file?.name}…</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">This may take a moment for large statements</p>
            </div>
          </motion.div>
        )}

        {/* ── Preview ready ── */}
        {stage === 'preview_ready' && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                {fileIcon(file?.name ?? '')}
                <span className="text-sm font-medium text-[var(--text)] truncate max-w-[200px]">{file?.name}</span>
              </div>
              <div className="flex gap-4 text-sm text-[var(--text-muted)] ml-auto">
                <span><b className="text-quillio-400">{rows.length}</b> new</span>
                {dupCount > 0 && <span><b className="text-[var(--text-subtle)]">{dupCount}</b> duplicates skipped</span>}
              </div>
            </div>

            {dupCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm">
                <AlertTriangle size={14} /> {dupCount} duplicate{dupCount > 1 ? 's' : ''} were detected and excluded automatically.
              </div>
            )}

            {rows.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-subtle)] text-sm">
                No new transactions found — all entries already exist.
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-[var(--text-muted)]">
                    {selected.size} of {rows.length} selected — uncheck any you don't want to import
                  </p>
                  <button
                    onClick={() => setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)))}
                    className="text-xs text-quillio-400 hover:text-quillio-300 transition-colors"
                  >
                    {selected.size === rows.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Rows table */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden max-h-[400px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--elevated)] border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2 px-4 text-left text-xs font-medium text-[var(--text-subtle)] w-8"></th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-[var(--text-subtle)]">Date</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-[var(--text-subtle)]">Type</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-[var(--text-subtle)]">Category</th>
                        <th className="py-2 px-4 text-right text-xs font-medium text-[var(--text-subtle)]">Amount</th>
                        <th className="py-2 px-3 text-xs font-medium text-[var(--text-subtle)] w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {rows.map((row, i) => (
                        <tr
                          key={i}
                          onClick={() => toggleRow(i)}
                          className={`cursor-pointer transition-colors ${selected.has(i) ? '' : 'opacity-40'} hover:bg-white/3`}
                        >
                          <td className="py-2.5 px-4">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              selected.has(i) ? 'bg-quillio-500 border-quillio-500' : 'border-[var(--border-strong)]'
                            }`}>
                              {selected.has(i) && <Check size={10} className="text-white" />}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                            {row.occurred_at?.slice(0, 10)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              row.direction === 'out' ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'
                            }`}>{cap(row.bucket)}</span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-[var(--text)] truncate max-w-[120px]">{cap(row.category)}</td>
                          <td className={`py-2.5 px-4 text-sm tabular font-medium text-right whitespace-nowrap ${
                            row.direction === 'out' ? 'text-expense' : 'text-income'
                          }`}>
                            {row.direction === 'out' ? '−' : '+'}{fmtCurrency(row.amount, currency)}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.needs_review && <AlertTriangle size={12} className="text-amber-400" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-white/5 transition-colors">
                    Start over
                  </button>
                  <button
                    onClick={commit}
                    disabled={selected.size === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 disabled:opacity-40 text-white text-sm font-medium transition-colors shadow-green-sm ml-auto"
                  >
                    Import {selected.size} transaction{selected.size !== 1 ? 's' : ''} <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Committing ── */}
        {stage === 'committing' && (
          <motion.div key="committing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center">
            <Loader2 size={32} className="animate-spin text-quillio-500" />
            <p className="font-semibold text-[var(--text)]">Saving transactions…</p>
          </motion.div>
        )}

        {/* ── Done ── */}
        {stage === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-income/15 flex items-center justify-center glow-green-sm">
              <Check size={28} className="text-income" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-[var(--text)]">
                {insertedCount} transaction{insertedCount !== 1 ? 's' : ''} imported
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Head to Dashboard or Transactions to see them.</p>
            </div>
            <button onClick={reset} className="px-5 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white text-sm font-medium transition-colors shadow-green-sm">
              Upload another
            </button>
          </motion.div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <X size={24} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Something went wrong</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{error || 'Could not parse the file.'}</p>
            </div>
            <button onClick={reset} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-white/5 transition-colors">
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
