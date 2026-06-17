import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { processStatement, processStatementSync } from '../services/statementProcessor.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /statements/preview — parse without committing; returns rows for user review
router.post('/preview', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const { buffer, mimetype } = req.file;
    const userId = req.user.id;

    const { rows, duplicateCount, totalParsed } = await processStatementSync(userId, buffer, mimetype);

    res.json({ rows, duplicateCount, totalParsed, newCount: rows.length });
  } catch (err) {
    console.error('[POST /statements/preview]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /statements/upload — full async commit (original flow; kept for backward compat)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const { buffer, mimetype, originalname } = req.file;
    const userId = req.user.id;

    const storagePath = `${userId}/${Date.now()}-${originalname}`;
    const { error: storeErr } = await supabase.storage
      .from('statements')
      .upload(storagePath, buffer, { contentType: mimetype });

    if (storeErr) return res.status(500).json({ error: `Storage upload failed: ${storeErr.message}` });

    const { data: { publicUrl } } = supabase.storage.from('statements').getPublicUrl(storagePath);

    const { data: stmt, error: insertErr } = await supabase
      .from('statements')
      .insert({ user_id: userId, file_url: publicUrl ?? storagePath, status: 'processing' })
      .select()
      .single();

    if (insertErr) return res.status(500).json({ error: insertErr.message });

    res.status(202).json({ id: stmt.id, status: 'processing', message: 'Statement received, processing in background.' });

    processStatement(stmt.id, userId, buffer, mimetype).catch(err =>
      console.error('[statements] processStatement error:', err.message)
    );
  } catch (err) {
    console.error('[POST /statements/upload]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /statements/commit — user approves preview rows; inserts them
router.post('/commit', requireAuth, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows array required' });
    }

    const userId = req.user.id;
    const currency = req.user.currency ?? 'NGN';

    const toInsert = rows.map(r => ({
      user_id: userId,
      direction: r.direction,
      bucket: r.bucket,
      amount: Number(r.amount),
      currency: r.currency ?? currency,
      category: r.category ?? '',
      source: r.source ?? '',
      remark: r.remark ?? '',
      channel: 'statement',
      occurred_at: r.occurred_at ?? new Date().toISOString(),
      raw_input: null,
      confidence: r.confidence ?? 0.9,
      needs_review: r.needs_review ?? false,
    }));

    const { data, error } = await supabase.from('transactions').insert(toInsert).select();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ inserted: data.length, transactions: data });
  } catch (err) {
    console.error('[POST /statements/commit]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /statements
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('statements')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /statements/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('statements')
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

export default router;
