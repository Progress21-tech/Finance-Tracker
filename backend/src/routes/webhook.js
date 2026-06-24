import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';
import { confirmationMessage } from '../engine/processMessage.js';
import { handleChatMessage } from '../engine/chat.js';
import { transcribeAudio } from '../services/groq.js';
import { downloadMedia, sendText } from '../services/whatsapp.js';
import { processStatement } from '../services/statementProcessor.js';

const router = Router();

// ── Webhook verification (Meta GET challenge) ────────────────────────────────
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── Incoming message handler ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  // Verify Meta HMAC signature
  if (config.WHATSAPP_APP_SECRET) {
    const sig = req.headers['x-hub-signature-256'];
    const expected = 'sha256=' + crypto
      .createHmac('sha256', config.WHATSAPP_APP_SECRET)
      .update(req.rawBody ?? JSON.stringify(req.body))
      .digest('hex');
    if (sig !== expected) return res.sendStatus(403);
  }

  // Acknowledge immediately — Meta retries if it doesn't get 200 fast
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const messages = change?.messages;
  if (!messages?.length) return;

  for (const msg of messages) {
    await handleMessage(msg, change).catch(err =>
      console.error('[webhook] handleMessage error:', err.message)
    );
  }
});

async function handleMessage(msg, change) {
  const from = msg.from; // sender's WhatsApp number
  const wa_number = from.startsWith('+') ? from : `+${from}`;

  // Look up user by WhatsApp number
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('whatsapp_number', wa_number)
    .single();

  if (!user) {
    await sendText(from, "Sorry, I don't recognise your number. Ask the admin to register you.");
    return;
  }

  const type = msg.type;

  if (type === 'text') {
    await handleTextMessage(msg.text.body, from, user);
    return;
  }

  if (type === 'audio') {
    await handleVoiceMessage(msg.audio.id, msg.audio.mime_type, from, user);
    return;
  }

  if (type === 'document' || type === 'image') {
    await handleDocumentMessage(msg[type], type, from, user);
    return;
  }

  await sendText(from, "I can handle text messages, voice notes, and document uploads. Try sending a text like: *spent 5k on fuel*");
}

async function handleTextMessage(text, from, user, channel = 'whatsapp_text') {
  const lower = text.toLowerCase().trim();

  if (lower.startsWith('edit ') || lower === 'edit') {
    await sendText(from, "To edit a transaction, use the API or reply with the corrected version and we'll re-parse it.");
    return;
  }

  const response = await handleChatMessage({
    user,
    message: text,
    channel,
    sessionId: from,
  });

  if (response.intent === 'record_transaction' && response.transaction) {
    await sendText(from, confirmationMessage(response.transaction));
    return;
  }

  await sendText(from, response.message);
}

async function handleVoiceMessage(mediaId, mimeType, from, user) {
  await sendText(from, '🎙️ Got your voice note, transcribing...');

  let text;
  try {
    const { buffer } = await downloadMedia(mediaId);
    text = await transcribeAudio(buffer, mimeType);
  } catch (err) {
    await sendText(from, "Sorry, I couldn't transcribe your voice note. Please try again.");
    console.error('[webhook] transcription error:', err.message);
    return;
  }

  if (!text) {
    await sendText(from, "I heard something but couldn't make out the words. Please try again.");
    return;
  }

  await sendText(from, `📝 Heard: _"${text}"_\nParsing...`);
  await handleTextMessage(text, from, { ...user, _voiceTranscript: text }, 'whatsapp_voice');
}

async function handleDocumentMessage(doc, type, from, user) {
  const allowed = ['application/pdf', 'text/csv', 'application/csv'];
  if (!allowed.some(t => doc.mime_type?.includes(t.split('/')[1]))) {
    await sendText(from, "Please send a PDF or CSV bank statement.");
    return;
  }

  await sendText(from, '📄 Got your statement, uploading and processing...');

  let buffer;
  try {
    const media = await downloadMedia(doc.id);
    buffer = media.buffer;
  } catch (err) {
    await sendText(from, "Couldn't download the file. Please try again.");
    return;
  }

  const storagePath = `${user.id}/${Date.now()}-statement.${doc.mime_type?.includes('pdf') ? 'pdf' : 'csv'}`;
  const { error: storeErr } = await supabase.storage
    .from('statements')
    .upload(storagePath, buffer, { contentType: doc.mime_type });

  if (storeErr) {
    await sendText(from, "Failed to store the file. Please try again.");
    return;
  }

  const { data: stmt } = await supabase
    .from('statements')
    .insert({ user_id: user.id, file_url: storagePath, status: 'processing' })
    .select()
    .single();

  processStatement(stmt.id, user.id, buffer, doc.mime_type).then(async () => {
    const { data } = await supabase.from('statements').select('tx_count').eq('id', stmt.id).single();
    await sendText(from, `✅ Statement processed! Found ${data?.tx_count ?? 0} new transactions.`);
  }).catch(async (err) => {
    await sendText(from, "Statement processing failed. Please try a different format.");
    console.error('[webhook] statement processing error:', err.message);
  });
}

function helpMessage() {
  return `*Finance Tracker — Quick Help* 💰

*Record a transaction:*
• _spent 5k on fuel_
• _got 250k salary from ProbeTech_
• _moved 50k to savings_
• _bought 100k of USDT_

*Bank alerts:*
Forward any debit/credit SMS directly.

*Upload statement:*
Send a PDF or CSV bank statement.

*Quick reports:*
Type *summary* for this month's overview.

For more, visit your dashboard.`;
}

export default router;
