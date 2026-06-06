import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../db/supabase.js';
import { processStatement } from '../services/statementProcessor.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /statements/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  if (!req.file) return res.status(400).json({ error: 'file required' });

  const { buffer, mimetype, originalname } = req.file;

  const storagePath = `${user_id}/${Date.now()}-${originalname}`;
  const { data: stored, error: storeErr } = await supabase.storage
    .from('statements')
    .upload(storagePath, buffer, { contentType: mimetype });

  if (storeErr) return res.status(500).json({ error: `Storage upload failed: ${storeErr.message}` });

  const { data: { publicUrl } } = supabase.storage.from('statements').getPublicUrl(storagePath);

  const { data: stmt, error: insertErr } = await supabase
    .from('statements')
    .insert({ user_id, file_url: publicUrl ?? storagePath, status: 'processing' })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  res.status(202).json({ id: stmt.id, status: 'processing', message: 'Statement received, processing in background.' });

  // Process asynchronously — don't await
  processStatement(stmt.id, user_id, buffer, mimetype).catch(err =>
    console.error('[statements] processStatement error:', err.message)
  );
});

// GET /statements?user_id=
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const { data, error } = await supabase
    .from('statements')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /statements/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('statements')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

export default router;
