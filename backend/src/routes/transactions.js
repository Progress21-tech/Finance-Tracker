import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { parseToRecord } from '../engine/parseRecord.js';
import { DIRECTION_VALUES, BUCKET_VALUES } from '../engine/validator.js';

const router = Router();

// GET /transactions?bucket=&direction=&category=&from=&to=&needs_review=&search=&sort=&limit=&offset=
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      bucket, direction, category, from, to, needs_review,
      search, sort = 'occurred_at_desc',
      limit = 50, offset = 0,
    } = req.query;

    const userId = req.user.id;
    const lim = Math.min(Number(limit), 200);
    const off = Number(offset);

    let q = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (bucket)       q = q.eq('bucket', bucket);
    if (direction)    q = q.eq('direction', direction);
    if (category)     q = q.eq('category', category);
    if (from)         q = q.gte('occurred_at', from);
    if (to)           q = q.lte('occurred_at', to);
    if (needs_review !== undefined) q = q.eq('needs_review', needs_review === 'true');
    if (search)       q = q.or(`remark.ilike.%${search}%,category.ilike.%${search}%,source.ilike.%${search}%`);

    const sortMap = {
      occurred_at_desc: ['occurred_at', { ascending: false }],
      occurred_at_asc:  ['occurred_at', { ascending: true }],
      amount_desc:      ['amount',      { ascending: false }],
      amount_asc:       ['amount',      { ascending: true }],
    };
    const [sortCol, sortOpts] = sortMap[sort] ?? sortMap.occurred_at_desc;
    q = q.order(sortCol, sortOpts).range(off, off + lim - 1);

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ data, total: count, limit: lim, offset: off });
  } catch (err) {
    console.error('[GET /transactions]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /transactions/summary/monthly — aggregated summary for current user
router.get('/summary/monthly', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user.id;

    let q = supabase
      .from('transactions')
      .select('direction, bucket, amount, category')
      .eq('user_id', userId);

    if (from) q = q.gte('occurred_at', from);
    if (to)   q = q.lte('occurred_at', to);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
    const categoryTotals = {};

    for (const tx of data) {
      totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;
      if (tx.bucket === 'expense') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    res.json({ totals, topCategories, txCount: data.length });
  } catch (err) {
    console.error('[GET /transactions/summary]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /transactions/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (error) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /transactions — manual entry (raw text or structured JSON)
router.post('/', requireAuth, async (req, res) => {
  console.log('[POST /transactions] body:', JSON.stringify(req.body));
  try {
    const { raw_text, ...fields } = req.body;
    const userId = req.user.id;

    let record;
    if (raw_text) {
      record = await parseToRecord(raw_text);
    } else {
      const { direction, bucket, amount } = fields;
      if (!direction || !bucket || amount == null) {
        return res.status(400).json({ error: 'direction, bucket, and amount are required' });
      }
      if (!DIRECTION_VALUES.includes(direction)) return res.status(400).json({ error: 'Invalid direction' });
      if (!BUCKET_VALUES.includes(bucket))       return res.status(400).json({ error: 'Invalid bucket' });
      record = { ...fields, confidence: 1, needs_review: false };
    }

    const row = {
      user_id: userId,
      direction: record.direction,
      bucket: record.bucket,
      amount: record.amount,
      currency: record.currency ?? req.user.currency ?? 'NGN',
      category: record.category ?? '',
      source: record.source ?? '',
      remark: record.remark ?? '',
      channel: 'manual',
      occurred_at: record.occurred_at ?? new Date().toISOString(),
      raw_input: raw_text ?? null,
      confidence: record.confidence ?? 1,
      needs_review: record.needs_review ?? false,
    };

    const { data, error } = await supabase.from('transactions').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (error) {
    console.error('TX ERROR:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /transactions/:id — edit remark, category, bucket, amount, occurred_at
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['remark', 'category', 'source', 'bucket', 'direction', 'amount', 'occurred_at', 'needs_review'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    if (updates.bucket    && !BUCKET_VALUES.includes(updates.bucket))       return res.status(400).json({ error: 'Invalid bucket' });
    if (updates.direction && !DIRECTION_VALUES.includes(updates.direction)) return res.status(400).json({ error: 'Invalid direction' });

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /transactions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
