import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtCurrency } from '../../lib/format';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });
}

function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function currentMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const EXPORT_PERIODS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_3m',    label: 'Last 3 months' },
  { id: 'last_6m',    label: 'Last 6 months' },
  { id: 'ytd',        label: 'Year to date' },
  { id: 'last_year',  label: 'Last year' },
];

export default function Reports() {
  const { user }  = useAuth();
  const currency  = user?.currency ?? 'NGN';
  const [month, setMonth]         = useState(currentMonth());
  const [exportPeriod, setExport] = useState('this_month');
  const [downloading, setDL]      = useState<'xlsx' | 'pdf' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['report-monthly', month],
    queryFn: () => api.reports.monthly(month),
  });

  async function handleExport(format: 'xlsx' | 'pdf') {
    setDL(format);
    try {
      const blob = await api.reports.export(format, exportPeriod);
      const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
      await downloadBlob(blob, `quillio_report_${exportPeriod}.${ext}`);
    } catch (e) {
      console.error(e);
    } finally {
      setDL(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--text)]">Reports</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Monthly summaries and file exports</p>
      </div>

      {/* Monthly report */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-sm text-[var(--text)]">Monthly summary</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-medium text-[var(--text)] min-w-[140px] text-center">
              {monthLabel(month)}
            </span>
            <button
              onClick={() => setMonth(nextMonth(month))}
              disabled={month >= currentMonth()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : data ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Totals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Earned',   value: data.totals.income,     color: 'text-income' },
                { label: 'Spent',    value: data.totals.expense,    color: 'text-expense' },
                { label: 'Saved',    value: data.totals.saving,     color: 'text-saving' },
                { label: 'Invested', value: data.totals.investment, color: 'text-investment' },
              ].map(m => (
                <div key={m.label} className="p-4 rounded-xl bg-[var(--elevated)] border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">{m.label}</p>
                  <p className={`font-display font-bold text-xl tabular ${m.color}`}>{fmtCurrency(m.value, currency)}</p>
                </div>
              ))}
            </div>

            {/* Net + savings rate */}
            <div className="flex flex-wrap gap-4 px-1">
              <div>
                <span className="text-xs text-[var(--text-subtle)]">Net</span>
                <p className={`text-base font-semibold tabular ${data.net >= 0 ? 'text-income' : 'text-expense'}`}>
                  {data.net >= 0 ? '+' : ''}{fmtCurrency(data.net, currency)}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-subtle)]">Savings rate</span>
                <p className="text-base font-semibold text-saving">{data.savingsRate}%</p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-subtle)]">Transactions</span>
                <p className="text-base font-semibold text-[var(--text)]">{data.txCount}</p>
              </div>
            </div>

            {/* Top categories */}
            {data.topCategories.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Top expenses</p>
                <div className="space-y-1.5">
                  {data.topCategories.map(c => (
                    <div key={c.category} className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)] capitalize">{c.category}</span>
                      <span className="tabular font-medium text-[var(--text)]">{fmtCurrency(c.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <p className="text-sm text-[var(--text-subtle)] text-center py-8">No data for {monthLabel(month)}</p>
        )}
      </div>

      {/* Export */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <h2 className="font-semibold text-sm text-[var(--text)] mb-1">Export your data</h2>
        <p className="text-xs text-[var(--text-muted)] mb-5">Download a full report as a spreadsheet or PDF</p>

        <div className="flex flex-wrap gap-3 mb-5">
          {EXPORT_PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setExport(p.id)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-150 ${
                exportPeriod === p.id
                  ? 'bg-quillio-500/15 border-quillio-500/40 text-quillio-400'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!!downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-quillio-500/30 hover:text-quillio-400 disabled:opacity-50 transition-all"
          >
            {downloading === 'xlsx'
              ? <Loader2 size={15} className="animate-spin" />
              : <FileSpreadsheet size={15} className="text-income" />}
            Download Excel (.xlsx)
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={!!downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-quillio-500/30 hover:text-quillio-400 disabled:opacity-50 transition-all"
          >
            {downloading === 'pdf'
              ? <Loader2 size={15} className="animate-spin" />
              : <FileText size={15} className="text-expense" />}
            Download PDF
          </button>
        </div>

        <p className="text-xs text-[var(--text-subtle)] mt-3 flex items-center gap-1.5">
          <Download size={11} /> Files download directly to your device — nothing stored on our servers.
        </p>
      </div>
    </div>
  );
}
