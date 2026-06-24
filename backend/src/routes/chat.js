import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { handleChatMessage } from '../engine/chat.js';

const router = Router();

// POST /chat
// Body: { message: string, history?: [{ role, content }], sessionId?: string }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await handleChatMessage({
      user: req.user,
      message,
      history,
      sessionId: sessionId ?? 'web',
      channel: 'manual',
    });

    res.json(response);
  } catch (err) {
    console.error('[POST /chat]', err.message);
    res.status(500).json({ error: err.message || 'Chat request failed' });
  }
});

export default router;
