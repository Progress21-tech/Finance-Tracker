import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, BarChart2, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, DashboardData } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtCurrency, fmtCompact, fmtDate, cap } from '../../lib/format';

// ── Period selector ───────────────────────────────────────────────────────────

const PERIODS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_3m',    label: '3 months' },
  { id: 'last_6m',    label: '6 months' },
  { id: 'ytd',        label: 'Year to date' },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

// ── Metric card ───────────────────────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function MetricCard({ label, value, currency, icon, color, sub }: MetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</span>
      </div>
      <div>
        <p className={`font-display font-bold text-2xl tabular leading-none ${color}`}>
          {fmtCurrency(value, currency)}
        </p>
        {sub && <p className="text-xs text-[var(--text-subtle)] mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, currency }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; currency: string }) {
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

// ── Category donut ────────────────────────────────────────────────────────────

const CAT_COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#A3E635', '#F87171', '#F59E0B'];

function CategoryDonut({ data, currency }: { data: DashboardData['categoryBreakdown']; currency: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (!data.length) return <p className="text-sm text-[var(--text-subtle)] text-center py-6">No expense data yet</p>;

  const pieData = data.slice(0, 7);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="amount"
              nameKey="category"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={2}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {pieData.map((_, i) => (
                <Cell
                  key={i}
                  fill={CAT_COLORS[i % CAT_COLORS.length]}
                  opacity={active === null || active === i ? 1 : 0.4}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {pieData.map((d, i) => (
          <div
            key={d.category}
            className="flex items-center gap-2"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
            <span className="text-xs text-[var(--text-muted)] flex-1 truncate">{cap(d.category)}</span>
            <span className="text-xs tabular text-[var(--text)] font-medium">{fmtCurrency(d.amount, currency)}</span>
            <span className="text-[10px] text-[var(--text-subtle)] w-8 text-right">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this_month');
  const currency = user?.currency ?? 'NGN';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => api.dashboard.get(period),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Your financial overview at a glance</p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
                period === p.id
                  ? 'bg-quillio-500 text-white shadow-green-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={16} />
          Failed to load dashboard data. The server may be warming up — try again in a moment.
        </div>
      )}

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Balance"  value={data.balance}           currency={currency} icon={<Wallet size={16}      />} color="text-quillio-400" sub="All-time net" />
          <MetricCard label="Earned"   value={data.totals.income}     currency={currency} icon={<TrendingUp size={16}  />} color="text-income"      sub={`${data.savingsRate}% saved`} />
          <MetricCard label="Spent"    value={data.totals.expense}    currency={currency} icon={<TrendingDown size={16}/>} color="text-expense"     sub={`${data.txCount} transactions`} />
          <MetricCard label="Saved"    value={data.totals.saving}     currency={currency} icon={<PiggyBank size={16}   />} color="text-saving" />
          <MetricCard label="Invested" value={data.totals.investment} currency={currency} icon={<BarChart2 size={16}   />} color="text-investment" />
        </div>
      )}

      {/* Needs-review banner */}
      {data && data.needsReviewCount > 0 && (
        <Link
          to="/app/transactions?needs_review=true"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm hover:bg-amber-400/15 transition-colors"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>{data.needsReviewCount} transaction{data.needsReviewCount > 1 ? 's' : ''} need your review</span>
          <ArrowRight size={14} className="ml-auto" />
        </Link>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cash-flow chart */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-semibold text-sm text-[var(--text)] mb-4">Cash flow</h2>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : data && data.cashFlowSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.cashFlowSeries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Area type="monotone" dataKey="income"  stroke="#10B981" strokeWidth={2} fill="url(#gIncome)"  dot={false} name="income" />
                <Area type="monotone" dataKey="expense" stroke="#F87171" strokeWidth={2} fill="url(#gExpense)" dot={false} name="expense" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-subtle)] text-center py-16">No data yet — log some transactions to see your cash flow</p>
          )}
        </div>

        {/* Category breakdown */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-semibold text-sm text-[var(--text)] mb-4">Spending by category</h2>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : data ? (
            <CategoryDonut data={data.categoryBreakdown} currency={currency} />
          ) : null}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-[var(--text)]">Recent transactions</h2>
          <Link to="/app/transactions" className="text-xs text-quillio-400 hover:text-quillio-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : data?.recentTransactions.length ? (
          <div className="divide-y divide-[var(--border)]">
            {data.recentTransactions.map(tx => {
              const isOut = tx.direction === 'out';
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isOut ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'
                  }`}>
                    {isOut ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] truncate">{cap(tx.category) || cap(tx.bucket)}</p>
                    <p className="text-xs text-[var(--text-subtle)]">{fmtDate(tx.occurred_at)}</p>
                  </div>
                  <p className={`text-sm font-semibold tabular shrink-0 ${isOut ? 'text-expense' : 'text-income'}`}>
                    {isOut ? '−' : '+'}{fmtCurrency(tx.amount, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-subtle)] text-center py-8">
            No transactions in this period yet.{' '}
            <Link to="/app" className="text-quillio-400 hover:underline">Start logging</Link>
          </p>
        )}
      </div>
    </div>
  );
}
