import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { parseAndStore, buildQuickSummary, confirmationMessage } from '../engine/processMessage.js';
import { transcribeAudio } from '../services/groq.js';
import { sendTelegramMessage, downloadTelegramFile } from '../services/telegram.js';

const router = Router();

// POST /telegram/webhook
router.post('/webhook', async (req, res) => {
  // Always 200 immediately — Telegram will retry forever if it gets anything else
  res.sendStatus(200);

  const { message } = req.body;
  if (!message) return;

  const chatId = message.chat.id;

  // Determine message type
  const isText = Boolean(message.text);
  const isVoice = Boolean(message.voice);
  if (!isText && !isVoice) return;

  // Route user by telegram_chat_id
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_chat_id', String(chatId))
    .single();

  if (!user) {
    await sendTelegramMessage(chatId,
      "Sorry, I don't recognise your Telegram account. Ask the admin to register you."
    ).catch(() => {});
    return;
  }

  if (isText) {
    await handleText(message.text, chatId, user).catch(err =>
      console.error('[telegram] handleText error:', err.message)
    );
    return;
  }

  await handleVoice(message.voice.file_id, chatId, user).catch(err =>
    console.error('[telegram] handleVoice error:', err.message)
  );
});

async function handleText(text, chatId, user) {
  const lower = text.toLowerCase().trim();

  if (lower === 'help' || lower === '/help') {
    await sendTelegramMessage(chatId, helpMessage());
    return;
  }

  if (lower === 'summary' || lower === '/summary' || lower === 'report' || lower === '/report') {
    await sendTelegramMessage(chatId, await buildQuickSummary(user));
    return;
  }

  const { record, error } = await parseAndStore(text, user.id, 'telegram_text');

  if (error === 'zero_amount') {
    await sendTelegramMessage(chatId, "I couldn't figure out the amount. Try: *spent 5k on fuel* or *got 50k salary*");
    return;
  }
  if (error === 'db_error') {
    await sendTelegramMessage(chatId, "There was an error saving the record. Please try again.");
    return;
  }
  if (error) {
    await sendTelegramMessage(chatId, "Sorry, I couldn't parse that. Try: *spent 5k on fuel* or *got 50k salary*");
    return;
  }

  await sendTelegramMessage(chatId, confirmationMessage(record));
}

async function handleVoice(fileId, chatId, user) {
  await sendTelegramMessage(chatId, '🎙️ Got your voice note, transcribing...');

  let text;
  try {
    const { buffer, mimeType } = await downloadTelegramFile(fileId);
    text = await transcribeAudio(buffer, mimeType);
  } catch (err) {
    await sendTelegramMessage(chatId, "Sorry, I couldn't transcribe your voice note. Please try again.");
    console.error('[telegram] transcription error:', err.message);
    return;
  }

  if (!text) {
    await sendTelegramMessage(chatId, "I heard something but couldn't make out the words. Please try again.");
    return;
  }

  await sendTelegramMessage(chatId, `📝 Heard: "${text}"\nParsing...`);
  await handleText(text, chatId, user);
}

function helpMessage() {
  return `*Finance Tracker — Quick Help* 💰

*Record a transaction:*
• spent 5k on fuel
• got 250k salary from ProbeTech
• moved 50k to savings
• bought 100k of USDT

*Bank alerts:*
Forward any debit/credit SMS directly.

*Commands:*
/summary — this month's overview
/help — show this message`;
}

export default router;
