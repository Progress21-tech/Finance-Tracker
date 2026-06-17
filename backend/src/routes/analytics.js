import { Router } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { resolvePeriod } from '../lib/periods.js';
import { config } from '../config.js';

const router = Router();
const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// GET /analytics?period=...
// Returns spending trends, category-over-time breakdown, savings rate timeline
router.get('/', requireAuth, async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const range = resolvePeriod(period, from, to);
    const userId = req.user.id;

    const { data: txs, error } = await supabase
      .from('transactions')
      .select('bucket, amount, category, occurred_at, direction')
      .eq('user_id', userId)
      .gte('occurred_at', range.from)
      .lte('occurred_at', range.to)
      .order('occurred_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Monthly timeline: bucket totals per month
    const monthlyBuckets = {};
    // Category over time: { category → { "YYYY-MM" → amount } }
    const categoryOverTime = {};

    for (const tx of txs) {
      const month = tx.occurred_at.slice(0, 7);

      if (!monthlyBuckets[month]) {
        monthlyBuckets[month] = { month, income: 0, expense: 0, saving: 0, investment: 0 };
      }
      monthlyBuckets[month][tx.bucket] += tx.amount;

      if (tx.bucket === 'expense') {
        if (!categoryOverTime[tx.category]) categoryOverTime[tx.category] = {};
        categoryOverTime[tx.category][month] = (categoryOverTime[tx.category][month] ?? 0) + tx.amount;
      }
    }

    // Convert monthly to sorted array + compute savings rate
    const monthlyTimeline = Object.values(monthlyBuckets)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        net: m.income - m.expense - m.saving - m.investment,
        savingsRate: m.income > 0
          ? Math.round(((m.saving + m.investment) / m.income) * 100)
          : 0,
      }));

    // Top categories overall
    const categoryTotals = {};
    for (const tx of txs) {
      if (tx.bucket === 'expense') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
      }
    }
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, amount]) => ({ category, amount }));

    // Spending trend (MoM change in expenses, last 2 months if enough data)
    const months = monthlyTimeline;
    let spendingTrend = null;
    if (months.length >= 2) {
      const prev = months[months.length - 2].expense;
      const curr = months[months.length - 1].expense;
      spendingTrend = prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
    }

    res.json({
      period: { from: range.from, to: range.to },
      monthlyTimeline,
      topCategories,
      categoryOverTime,
      spendingTrend,
    });
  } catch (err) {
    console.error('[GET /analytics]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/suggestions
// Groq-powered natural language budgeting insights
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;

    // Pull last 3 months of data for context
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('bucket, amount, category, occurred_at')
      .eq('user_id', userId)
      .gte('occurred_at', threeMonthsAgo.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Summarize into compact numbers for the prompt
    const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
    const categoryTotals = {};
    for (const tx of txs) {
      totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;
      if (tx.bucket === 'expense') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
      }
    }
    const topCats = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const savingsRate = totals.income > 0
      ? ((totals.saving + totals.investment) / totals.income * 100).toFixed(1)
      : '0';

    const currency = user.currency ?? 'NGN';
    const fmt = n => `${currency} ${Number(n).toLocaleString('en-NG')}`;

    const summaryText = [
      `Period: last 3 months`,
      `Total income: ${fmt(totals.income)}`,
      `Total expenses: ${fmt(totals.expense)}`,
      `Total saved: ${fmt(totals.saving)}`,
      `Total invested: ${fmt(totals.investment)}`,
      `Savings rate: ${savingsRate}%`,
      `Top spending categories:`,
      ...topCats.map(([cat, amt]) => `  - ${cat}: ${fmt(amt)}`),
      user.preferences?.primary_goal ? `User's stated financial goal: ${user.preferences.primary_goal}` : '',
      user.preferences?.monthly_income_range ? `Stated monthly income range: ${user.preferences.monthly_income_range}` : '',
    ].filter(Boolean).join('\n');

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are a personal finance coach for Nigerian users.
Given a financial summary, provide 3-5 short, specific, actionable budgeting suggestions in plain English.
Format as a JSON array: [{"title": "short title", "body": "1-2 sentence suggestion"}].
Be specific to the numbers. Mention concrete amounts in ${currency}.
Return ONLY valid JSON, no markdown fences, no prose outside the array.`,
        },
        {
          role: 'user',
          content: summaryText,
        },
      ],
    });

    let raw = completion.choices[0].message.content.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let suggestions;
    try {
      suggestions = JSON.parse(raw);
    } catch {
      suggestions = [{ title: 'AI suggestions unavailable', body: 'Could not parse model response.' }];
    }

    res.json({ suggestions, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[GET /analytics/suggestions]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
