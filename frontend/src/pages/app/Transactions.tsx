import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Tx } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtCurrency, fmtDateTime, cap } from '../../lib/format';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

const BUCKETS = ['', 'income', 'expense', 'saving', 'investment'] as const;
const SORTS = [
  { id: 'occurred_at_desc', label: 'Newest' },
  { id: 'occurred_at_asc',  label: 'Oldest' },
  { id: 'amount_desc',      label: 'Amount ↓' },
  { id: 'amount_asc',       label: 'Amount ↑' },
];

// ── Inline edit row ───────────────────────────────────────────────────────────

function TxRow({ tx, currency, onDeleted }: { tx: Tx; currency: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [remark, setRemark]   = useState(tx.remark);
  const [category, setCat]    = useState(tx.category);
  const [amount, setAmount]   = useState(String(tx.amount));

  const update = useMutation({
    mutationFn: (body: Partial<Tx>) => api.transactions.update(tx.id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); setEditing(false); },
  });
  const remove = useMutation({
    mutationFn: () => api.transactions.delete(tx.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); onDeleted(); },
  });

  const isOut = tx.direction === 'out';

  function save() {
    update.mutate({
      remark, category,
      amount: Number(amount) || tx.amount,
    });
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`border-b border-[var(--border)] last:border-0 ${tx.needs_review ? 'bg-amber-400/5' : ''}`}
    >
      {editing ? (
        <>
          <td className="py-3 px-4 text-xs text-[var(--text-subtle)]">{fmtDateTime(tx.occurred_at)}</td>
          <td className="py-3 px-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOut ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'}`}>
              {cap(tx.bucket)}
            </span>
          </td>
          <td className="py-3 px-4">
            <input value={category} onChange={e => setCat(e.target.value)}
              className="w-full text-xs bg-[var(--elevated)] border border-quillio-500/40 rounded-lg px-2 py-1 outline-none text-[var(--text)]" />
          </td>
          <td className="py-3 px-4">
            <input value={remark} onChange={e => setRemark(e.target.value)}
              className="w-full text-xs bg-[var(--elevated)] border border-quillio-500/40 rounded-lg px-2 py-1 outline-none text-[var(--text)]" />
          </td>
          <td className="py-3 px-4">
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
              className="w-24 text-xs bg-[var(--elevated)] border border-quillio-500/40 rounded-lg px-2 py-1 outline-none text-[var(--text)] tabular" />
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-1">
              <button onClick={save} className="w-7 h-7 flex items-center justify-center rounded-lg bg-quillio-500 text-white hover:bg-quillio-400 transition-colors">
                <Check size={13} />
              </button>
              <button onClick={() => setEditing(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-white/5 transition-colors">
                <X size={13} />
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-3 px-4 text-xs text-[var(--text-subtle)] whitespace-nowrap">{fmtDateTime(tx.occurred_at)}</td>
          <td className="py-3 px-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOut ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'}`}>
              {cap(tx.bucket)}
            </span>
          </td>
          <td className="py-3 px-4 text-xs text-[var(--text)] max-w-[120px] truncate">{cap(tx.category) || '—'}</td>
          <td className="py-3 px-4 text-xs text-[var(--text-muted)] max-w-[180px] truncate">{tx.remark || tx.source || '—'}</td>
          <td className={`py-3 px-4 text-sm font-semibold tabular whitespace-nowrap ${isOut ? 'text-expense' : 'text-income'}`}>
            {isOut ? '−' : '+'}{fmtCurrency(tx.amount, currency)}
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {tx.needs_review && <AlertTriangle size={13} className="text-amber-400" />}
              <button onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-white/5 transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => remove.mutate()} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-subtle)] hover:text-red-400 hover:bg-red-500/5 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </td>
        </>
      )}
    </motion.tr>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function AddModal({ currency, onClose }: { currency: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [raw, setRaw]   = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: (text: string) => api.transactions.create({ raw_text: text }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md glass-light rounded-2xl p-6 shadow-glass"
      >
        <h3 className="font-display font-bold text-lg text-[var(--text)] mb-4">Add transaction</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Describe it in plain English — e.g. "Spent ₦4,500 on groceries" or "Received ₦150,000 salary"
        </p>
        <textarea
          autoFocus
          value={raw}
          onChange={e => setRaw(e.target.value)}
          rows={3}
          placeholder="What happened with your money?"
          className="w-full px-4 py-3 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/50 resize-none transition-all mb-4"
        />
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-white/5 transition-colors">Cancel</button>
          <button
            onClick={() => create.mutate(raw)}
            disabled={!raw.trim() || create.isPending}
            className="flex-1 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-green-sm"
          >
            {create.isPending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PAGE = 30;

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'NGN';

  const [search, setSearch]     = useState('');
  const [bucket, setBucket]     = useState('');
  const [sort, setSort]         = useState('occurred_at_desc');
  const [offset, setOffset]     = useState(0);
  const [showAdd, setShowAdd]   = useState(false);
  const [debouncedSearch, setDS] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDS(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', bucket, sort, offset, debouncedSearch],
    queryFn: () => api.transactions.list({
      ...(bucket && { bucket }),
      sort,
      limit: String(PAGE),
      offset: String(offset),
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
  });

  const total = data?.total ?? 0;
  const pages = Math.ceil(total / PAGE);
  const page  = Math.floor(offset / PAGE) + 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text)]">Transactions</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {total > 0 ? `${total} total` : 'No transactions yet'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white text-sm font-medium transition-colors shadow-green-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Add transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search transactions…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/40 transition-all"
          />
        </div>

        <select
          value={bucket}
          onChange={e => { setBucket(e.target.value); setOffset(0); }}
          className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-quillio-500/40 transition-all"
        >
          <option value="">All types</option>
          {BUCKETS.slice(1).map(b => <option key={b} value={b}>{cap(b)}</option>)}
        </select>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-quillio-500/40 transition-all"
        >
          {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !data?.data.length ? (
          <div className="text-center py-16 text-[var(--text-subtle)] text-sm">
            {debouncedSearch || bucket ? 'No transactions match your filters.' : 'No transactions yet — start logging in chat.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Date', 'Type', 'Category', 'Remark', 'Amount', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-subtle)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {data.data.map(tx => (
                    <TxRow key={tx.id} tx={tx} currency={currency} onDeleted={() => {}} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--text-subtle)]">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(o => Math.max(0, o - PAGE))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setOffset(o => o + PAGE)}
              disabled={page >= pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && <AddModal currency={currency} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
