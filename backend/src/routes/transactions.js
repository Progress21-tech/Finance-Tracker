import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { parseToRecord } from '../engine/parseRecord.js';
import { DIRECTION_VALUES, BUCKET_VALUES } from '../engine/validator.js';

const router = Router();

// GET /transactions?user_id=&bucket=&from=&to=&needs_review=&limit=&offset=
router.get('/', async (req, res) => {
  const { user_id, bucket, direction, from, to, needs_review, limit = 50, offset = 0 } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  let q = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user_id)
    .order('occurred_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (bucket) q = q.eq('bucket', bucket);
  if (direction) q = q.eq('direction', direction);
  if (from) q = q.gte('occurred_at', from);
  if (to) q = q.lte('occurred_at', to);
  if (needs_review !== undefined) q = q.eq('needs_review', needs_review === 'true');

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /transactions/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// POST /transactions — manual entry (raw text or structured JSON)
router.post('/', async (req, res) => {
  const { user_id, raw_text, ...fields } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  let record;
  if (raw_text) {
    record = await parseToRecord(raw_text);
  } else {
    const { direction, bucket, amount } = fields;
    if (!direction || !bucket || amount == null) {
      return res.status(400).json({ error: 'direction, bucket, and amount are required' });
    }
    if (!DIRECTION_VALUES.includes(direction)) return res.status(400).json({ error: 'Invalid direction' });
    if (!BUCKET_VALUES.includes(bucket)) return res.status(400).json({ error: 'Invalid bucket' });
    record = { ...fields, confidence: 1, needs_review: false };
  }

  const row = {
    user_id,
    direction: record.direction,
    bucket: record.bucket,
    amount: record.amount,
    currency: record.currency ?? 'NGN',
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
});

// PATCH /transactions/:id — edit remark, category, bucket, amount, occurred_at
router.patch('/:id', async (req, res) => {
  const allowed = ['remark', 'category', 'source', 'bucket', 'direction', 'amount', 'occurred_at', 'needs_review'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  if (updates.bucket && !BUCKET_VALUES.includes(updates.bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' });
  }
  if (updates.direction && !DIRECTION_VALUES.includes(updates.direction)) {
    return res.status(400).json({ error: 'Invalid direction' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /transactions/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('transactions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// GET /transactions/summary?user_id=&from=&to=
router.get('/summary/monthly', async (req, res) => {
  const { user_id, from, to } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  let q = supabase
    .from('transactions')
    .select('direction, bucket, amount, category')
    .eq('user_id', user_id);

  if (from) q = q.gte('occurred_at', from);
  if (to) q = q.lte('occurred_at', to);

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
});

export default router;
