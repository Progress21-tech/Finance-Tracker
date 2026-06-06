import cron from 'node-cron';
import { supabase } from '../db/supabase.js';
import { sendText, formatAmount } from '../services/whatsapp.js';

// Track which users have already been warned today (resets each run day)
const warnedToday = new Map(); // userId → boolean

export function startThresholdCron() {
  // Run every hour at :00 — Nigeria is UTC+1
  cron.schedule('0 * * * *', checkThresholds, { timezone: 'Africa/Lagos' });
  console.log('[cron] Daily threshold checker started (hourly)');
}

async function checkThresholds() {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  // Reset daily warn state at midnight
  const lastRunDate = checkThresholds._lastDate;
  if (lastRunDate !== todayKey) {
    warnedToday.clear();
    checkThresholds._lastDate = todayKey;
  }

  const dayStart = `${todayKey}T00:00:00+01:00`;
  const dayEnd = `${todayKey}T23:59:59+01:00`;

  const { data: users, error } = await supabase
    .from('users')
    .select('id, whatsapp_number, display_name, daily_threshold, currency');

  if (error) {
    console.error('[threshold cron] Failed to load users:', error.message);
    return;
  }

  for (const user of users) {
    if (warnedToday.get(user.id)) continue;

    const { data: txs } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('direction', 'out')
      .eq('bucket', 'expense')
      .gte('occurred_at', dayStart)
      .lte('occurred_at', dayEnd);

    const totalSpent = (txs ?? []).reduce((sum, tx) => sum + tx.amount, 0);

    if (totalSpent > user.daily_threshold) {
      const fmt = n => formatAmount(n, user.currency);
      const over = totalSpent - user.daily_threshold;
      const msg = `⚠️ *Daily spending alert*\n\n` +
        `You've spent ${fmt(totalSpent)} today, which is ${fmt(over)} over your daily limit of ${fmt(user.daily_threshold)}.\n\n` +
        `Type *summary* to see today's breakdown.`;

      try {
        await sendText(user.whatsapp_number, msg);
        warnedToday.set(user.id, true);
        console.log(`[threshold cron] Warning sent to ${user.display_name ?? user.whatsapp_number}`);
      } catch (err) {
        console.error(`[threshold cron] Failed to send to ${user.whatsapp_number}:`, err.message);
      }
    }
  }
}

checkThresholds._lastDate = null;
