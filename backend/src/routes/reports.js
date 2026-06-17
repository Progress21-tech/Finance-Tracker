import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { resolvePeriod, resolveMonth } from '../lib/periods.js';
import { aggregateTotals, topCategories, buildXlsx, buildPdf } from '../lib/reportBuilder.js';

const router = Router();

// GET /reports/monthly?month=YYYY-MM
// Returns aggregated summary for the given calendar month (no LLM narrative for now — Anthropic not available)
router.get('/monthly', requireAuth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

    let range;
    try { range = resolveMonth(month); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const userId = req.user.id;

    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', range.from)
      .lte('occurred_at', range.to)
      .order('occurred_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const totals = aggregateTotals(txs);
    const topCats = topCategories(txs, 5);
    const net = totals.income - totals.expense - totals.saving - totals.investment;
    const savingsRate = totals.income > 0
      ? Math.round(((totals.saving + totals.investment) / totals.income) * 100)
      : 0;

    res.json({
      month,
      label: range.label,
      period: { from: range.from, to: range.to },
      totals,
      net,
      savingsRate,
      topCategories: topCats.map(([category, amount]) => ({ category, amount })),
      txCount: txs.length,
    });
  } catch (err) {
    console.error('[GET /reports/monthly]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/export?format=xlsx|pdf&period=...&from=&to=
// Streams a downloadable file
router.get('/export', requireAuth, async (req, res) => {
  try {
    const { format, period, from, to } = req.query;
    if (!format || !['xlsx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be xlsx or pdf' });
    }

    let range;
    try { range = resolvePeriod(period, from, to); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const userId = req.user.id;
    const currency = req.user.currency ?? 'NGN';

    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', range.from)
      .lte('occurred_at', range.to)
      .order('occurred_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const totals = aggregateTotals(txs);
    const topCats = topCategories(txs, 10);

    // Period label for the report header
    const fromLabel = new Date(range.from).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    const toLabel   = new Date(range.to).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    const periodLabel = `${fromLabel} – ${toLabel}`;
    const slug = `${fromLabel.replace(/\s/g, '-')}_${toLabel.replace(/\s/g, '-')}`;

    if (format === 'xlsx') {
      const buffer = buildXlsx(txs, totals, topCats, periodLabel, currency);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="finance_report_${slug}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await buildPdf(txs, totals, topCats, periodLabel, currency);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="finance_report_${slug}.pdf"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('[GET /reports/export]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
