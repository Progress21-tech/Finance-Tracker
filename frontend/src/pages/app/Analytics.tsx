import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtCurrency, fmtCompact, cap } from '../../lib/format';

const PERIODS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_3m',    label: '3 months' },
  { id: 'last_6m',    label: '6 months' },
  { id: 'ytd',        label: 'Year to date' },
  { id: 'last_year',  label: 'Last year' },
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-light rounded-xl p-3 text-xs shadow-glass-sm border border-[var(--border)]">
      <p className="text-[var(--text-muted)] mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="tabular">
          {cap(p.name)}: {fmtCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
}

function SuggestionCard({ title, body, i }: { title: string; body: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.07 }}
      className="p-4 rounded-2xl border border-quillio-500/20 bg-quillio-500/5 flex gap-3"
    >
      <div className="w-7 h-7 rounded-xl bg-quillio-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-quillio-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text)] mb-1">{title}</p>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('last_3m');
  const currency = user?.currency ?? 'NGN';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.analytics.get(period),
  });

  const { data: suggData, isLoading: suggLoading, refetch: refetchSugg } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.analytics.suggestions(),
    staleTime: 1000 * 60 * 10,
  });

  const trend = data?.spendingTrend;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text)]">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Spending trends and AI-powered insights</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
                period === p.id ? 'bg-quillio-500 text-white shadow-green-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spending trend badge */}
      {trend !== null && trend !== undefined && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
          trend > 0
            ? 'bg-expense/10 border-expense/20 text-expense'
            : trend < 0
            ? 'bg-income/10 border-income/20 text-income'
            : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)]'
        }`}>
          {trend > 0 ? <TrendingUp size={15} /> : trend < 0 ? <TrendingDown size={15} /> : <Minus size={15} />}
          Spending {trend > 0 ? `up ${trend}%` : trend < 0 ? `down ${Math.abs(trend)}%` : 'unchanged'} vs previous period
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs expense timeline */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-semibold text-sm text-[var(--text)] mb-4">Income vs expenses</h2>
          {isLoading ? <Skeleton className="h-52" /> : data?.monthlyTimeline.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.monthlyTimeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="income"  fill="#10B981" radius={[4,4,0,0]} name="income"  maxBarSize={28} />
                <Bar dataKey="expense" fill="#F87171" radius={[4,4,0,0]} name="expense" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-subtle)] text-center py-16">No data for this period</p>
          )}
        </div>

        {/* Savings rate */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-semibold text-sm text-[var(--text)] mb-4">Savings rate</h2>
          {isLoading ? <Skeleton className="h-52" /> : data?.monthlyTimeline.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={data.monthlyTimeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={36} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="savingsRate" stroke="#14B8A6" strokeWidth={2.5} dot={{ r: 3, fill: '#14B8A6', strokeWidth: 0 }} name="Savings rate" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-subtle)] text-center py-16">No data for this period</p>
          )}
        </div>
      </div>

      {/* Top categories */}
      {(isLoading || data?.topCategories.length) && (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-semibold text-sm text-[var(--text)] mb-4">Top spending categories</h2>
          {isLoading ? <Skeleton className="h-40" /> : (
            <div className="space-y-3">
              {data?.topCategories.map((cat, i) => {
                const max = data.topCategories[0]?.amount ?? 1;
                const pct = Math.round((cat.amount / max) * 100);
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] w-4 shrink-0">{i + 1}</span>
                    <span className="text-sm text-[var(--text)] w-32 truncate shrink-0">{cap(cat.category)}</span>
                    <div className="flex-1 h-1.5 bg-[var(--elevated)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full bg-quillio-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs tabular text-[var(--text)] font-medium w-28 text-right shrink-0">
                      {fmtCurrency(cat.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      <div className="p-5 rounded-2xl border border-quillio-500/15 bg-[var(--card)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-quillio-500/15 flex items-center justify-center">
              <Sparkles size={16} className="text-quillio-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[var(--text)]">AI budgeting suggestions</h2>
              <p className="text-xs text-[var(--text-subtle)]">Personalised insights from your last 3 months</p>
            </div>
          </div>
          <button
            onClick={() => refetchSugg()}
            disabled={suggLoading}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={suggLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {suggLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin text-quillio-500" />
            Analysing your spending patterns…
          </div>
        ) : suggData?.suggestions.length ? (
          <div className="space-y-3">
            {suggData.suggestions.map((s, i) => (
              <SuggestionCard key={i} title={s.title} body={s.body} i={i} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-subtle)]">Log a few more transactions and Quillio will generate personalised insights.</p>
        )}
      </div>
    </div>
  );
}
