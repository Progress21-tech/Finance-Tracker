import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { resolvePeriod } from '../lib/periods.js';

const router = Router();

// GET /dashboard?period=this_month|last_month|last_3m|last_6m|ytd|last_year|custom&from=&to=
router.get('/', requireAuth, async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const range = resolvePeriod(period, from, to);
    const userId = req.user.id;

    // Fetch all transactions in period (minimal columns for aggregation)
    const { data: periodTxs, error } = await supabase
      .from('transactions')
      .select('direction, bucket, amount, category, occurred_at, source, remark, currency, needs_review')
      .eq('user_id', userId)
      .gte('occurred_at', range.from)
      .lte('occurred_at', range.to)
      .order('occurred_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // All-time net balance (income − expense − saving − investment)
    const { data: allTxs } = await supabase
      .from('transactions')
      .select('bucket, amount, direction')
      .eq('user_id', userId);

    // ── Aggregations ──────────────────────────────────────────────────────────

    const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
    const categoryMap = {};
    const monthlyMap = {}; // "YYYY-MM" → { income, expense, saving, investment }

    for (const tx of periodTxs) {
      totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;

      if (tx.bucket === 'expense') {
        categoryMap[tx.category] = (categoryMap[tx.category] ?? 0) + tx.amount;
      }

      const monthKey = tx.occurred_at.slice(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0, saving: 0, investment: 0 };
      }
      monthlyMap[monthKey][tx.bucket] += tx.amount;
    }

    // Current balance (all-time net)
    const allTimeTotals = { income: 0, expense: 0, saving: 0, investment: 0 };
    for (const tx of allTxs ?? []) {
      allTimeTotals[tx.bucket] = (allTimeTotals[tx.bucket] ?? 0) + tx.amount;
    }
    const balance = allTimeTotals.income - allTimeTotals.expense;

    // Category breakdown sorted by amount
    const categoryBreakdown = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totals.expense > 0 ? Math.round((amount / totals.expense) * 100) : 0,
      }));

    // Cash-flow series sorted chronologically
    const cashFlowSeries = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, net: m.income - m.expense - m.saving - m.investment }));

    // Recent 10 transactions for the period (already ordered desc)
    const recentTransactions = periodTxs.slice(0, 10);

    // Needs-review count
    const needsReviewCount = periodTxs.filter(t => t.needs_review).length;

    res.json({
      period: { from: range.from, to: range.to },
      totals,
      balance,
      net: totals.income - totals.expense - totals.saving - totals.investment,
      savingsRate: totals.income > 0
        ? Math.round(((totals.saving + totals.investment) / totals.income) * 100)
        : 0,
      categoryBreakdown,
      cashFlowSeries,
      recentTransactions,
      needsReviewCount,
      txCount: periodTxs.length,
    });
  } catch (err) {
    console.error('[GET /dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
