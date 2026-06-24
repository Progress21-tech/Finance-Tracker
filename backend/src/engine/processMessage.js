/**
 * Shared message-processing core.
 *
 * Both the WhatsApp and Telegram webhooks call parseAndStore() to parse a text
 * input and write a transaction. Neither channel re-implements this logic.
 * notifyUser() sends a message to every channel the user has configured, so
 * cron jobs only need one call to reach the user regardless of channel.
 */

import { supabase } from '../db/supabase.js';
import { parseToRecord } from './parseRecord.js';
import { preExtractAlert, enrichPromptWithAlert } from '../services/bankAlerts.js';
import { confirmationMessage } from '../services/whatsapp.js';

export { confirmationMessage };

export async function parseAndStore(rawText, userId, channel) {
  const extracted = preExtractAlert(rawText);
  const enriched = enrichPromptWithAlert(rawText, extracted);
  const effectiveChannel = extracted ? 'alert' : channel;

  let record;
  try {
    record = await parseToRecord(enriched, { now: new Date().toISOString() });
  } catch (err) {
    console.error('[processMessage] parseToRecord threw:', err.message);
    return { record: null, stored: false, error: 'parse_error' };
  }

  if (record.needs_review && record.amount === 0) {
    return { record, stored: false, error: 'zero_amount' };
  }

  const { data: transaction, error: dbError } = await supabase.from('transactions').insert({
    user_id: userId,
    direction: record.direction,
    bucket: record.bucket,
    amount: record.amount,
    currency: record.currency,
    category: record.category,
    source: record.source,
    remark: record.remark,
    channel: effectiveChannel,
    occurred_at: record.occurred_at,
    raw_input: rawText,
    confidence: record.confidence,
    needs_review: record.needs_review,
  }).select().single();

  if (dbError) {
    console.error('[processMessage] DB insert error:', dbError.message);
    return { record, stored: false, error: 'db_error' };
  }

  return { record, transaction, stored: true, error: null };
}

export async function buildQuickSummary(user) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data } = await supabase
    .from('transactions')
    .select('bucket, amount')
    .eq('user_id', user.id)
    .gte('occurred_at', monthStart);

  if (!data?.length) return 'No transactions recorded this month yet.';

  const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
  for (const tx of data) totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;

  const fmt = n => `₦${Number(n).toLocaleString('en-NG')}`;
  return (
    `*${now.toLocaleString('en-NG', { month: 'long' })} Summary* 📊\n\n` +
    `💰 Earned: ${fmt(totals.income)}\n` +
    `💸 Spent: ${fmt(totals.expense)}\n` +
    `🏦 Saved: ${fmt(totals.saving)}\n` +
    `📈 Invested: ${fmt(totals.investment)}\n\n` +
    `Net: ${fmt(totals.income - totals.expense - totals.saving - totals.investment)}`
  );
}

// Sends to every channel the user has configured.
// Import is deferred to avoid a circular-dependency at module load time.
export async function notifyUser(user, text) {
  const { sendText } = await import('../services/whatsapp.js');
  const { sendTelegramMessage } = await import('../services/telegram.js');

  const sends = [];

  if (user.whatsapp_number) {
    sends.push(
      sendText(user.whatsapp_number, text).catch(err =>
        console.error(`[notifyUser] WhatsApp failed for ${user.id}:`, err.message)
      )
    );
  }

  if (user.telegram_chat_id) {
    sends.push(
      sendTelegramMessage(user.telegram_chat_id, text).catch(err =>
        console.error(`[notifyUser] Telegram failed for ${user.id}:`, err.message)
      )
    );
  }

  await Promise.all(sends);
}
