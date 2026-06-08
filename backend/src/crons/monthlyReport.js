import cron from 'node-cron';
import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/supabase.js';
import { formatAmount } from '../services/whatsapp.js';
import { notifyUser } from '../engine/processMessage.js';
import { config } from '../config.js';

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

export function startMonthlyReportCron() {
  // 1st of each month at 07:00 Lagos time
  cron.schedule('0 7 1 * *', runMonthlyReports, { timezone: 'Africa/Lagos' });
  console.log('[cron] Monthly report cron started (1st of month at 07:00)');
}

export async function runMonthlyReports() {
  const now = new Date();
  const priorMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = priorMonthDate.getFullYear();
  const month = priorMonthDate.getMonth(); // 0-indexed

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const monthLabel = priorMonthDate.toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  const { data: users } = await supabase
    .from('users')
    .select('id, whatsapp_number, telegram_chat_id, display_name, currency');

  for (const user of users ?? []) {
    await generateAndSendReport(user, from, to, monthLabel).catch(err =>
      console.error(`[monthly report] Failed for ${user.display_name ?? user.id}:`, err.message)
    );
  }
}

async function generateAndSendReport(user, from, to, monthLabel) {
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('occurred_at', from)
    .lte('occurred_at', to)
    .order('occurred_at', { ascending: true });

  if (!txs?.length) {
    await notifyUser(user, `No transactions recorded for ${monthLabel}.`);
    return;
  }

  const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
  const categoryTotals = {};
  const biggestExpenses = [];

  for (const tx of txs) {
    totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;
    if (tx.bucket === 'expense') {
      categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
      biggestExpenses.push(tx);
    }
  }

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topExpenses = biggestExpenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Claude summary narrative
  const summary = await generateSummary(user, totals, topCategories, monthLabel);

  // Build xlsx
  const xlsxBuffer = buildXlsx(txs, totals, topCategories, monthLabel, user.currency);

  // Upload xlsx to Supabase storage
  const storagePath = `${user.id}/reports/${monthLabel.replace(' ', '-')}.xlsx`;
  await supabase.storage
    .from('statements')
    .upload(storagePath, xlsxBuffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', upsert: true });

  const { data: urlData } = supabase.storage.from('statements').getPublicUrl(storagePath);
  const reportUrl = urlData?.publicUrl ?? '';

  const fmt = n => formatAmount(n, user.currency);
  const msg = `📊 *${monthLabel} Report*\n\n` +
    `${summary}\n\n` +
    `*Breakdown:*\n` +
    `💰 Earned: ${fmt(totals.income)}\n` +
    `💸 Spent: ${fmt(totals.expense)}\n` +
    `🏦 Saved: ${fmt(totals.saving)}\n` +
    `📈 Invested: ${fmt(totals.investment)}\n\n` +
    (topCategories.length ? `*Top spending:* ${topCategories.map(([c, a]) => `${c} (${fmt(a)})`).join(', ')}\n\n` : '') +
    (reportUrl ? `📥 Download full report:\n${reportUrl}` : '');

  await notifyUser(user, msg);
  console.log(`[monthly report] Sent to ${user.display_name ?? user.id}`);
}

async function generateSummary(user, totals, topCategories, monthLabel) {
  const name = user.display_name ?? 'You';
  const fmt = n => `₦${Number(n).toLocaleString('en-NG')}`;
  const topCatText = topCategories.map(([c, a]) => `${c} (${fmt(a)})`).join(', ');

  const prompt = `Write a 2-3 sentence plain-English personal finance summary for ${name}'s ${monthLabel}.
Data: earned ${fmt(totals.income)}, spent ${fmt(totals.expense)}, saved ${fmt(totals.saving)}, invested ${fmt(totals.investment)}.
Top spending categories: ${topCatText || 'none'}.
Be warm, brief, and actionable. No markdown.`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    return msg.content[0].text.trim();
  } catch {
    return `${name} earned ${fmt(totals.income)} and spent ${fmt(totals.expense)} in ${monthLabel}.`;
  }
}

function buildXlsx(txs, totals, topCategories, monthLabel, currency = 'NGN') {
  const wb = XLSX.utils.book_new();
  const fmt = n => Number(n).toFixed(2);

  // ── Transactions sheet ────────────────────────────────────────────────────
  const txRows = txs.map(tx => ({
    Date: new Date(tx.occurred_at).toLocaleDateString('en-NG'),
    Time: new Date(tx.occurred_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
    Type: tx.bucket,
    Direction: tx.direction === 'in' ? 'Credit' : 'Debit',
    Category: tx.category,
    'Source / Payee': tx.source,
    [`Amount (${currency})`]: fmt(tx.amount),
    Remark: tx.remark,
    Channel: tx.channel,
    'Needs Review': tx.needs_review ? 'Yes' : '',
  }));

  const txSheet = XLSX.utils.json_to_sheet(txRows);
  txSheet['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // ── Summary sheet ─────────────────────────────────────────────────────────
  const summaryRows = [
    { Category: `${monthLabel} Summary`, [`Amount (${currency})`]: '' },
    { Category: '', [`Amount (${currency})`]: '' },
    { Category: 'Total Income', [`Amount (${currency})`]: fmt(totals.income) },
    { Category: 'Total Expenses', [`Amount (${currency})`]: fmt(totals.expense) },
    { Category: 'Total Saved', [`Amount (${currency})`]: fmt(totals.saving) },
    { Category: 'Total Invested', [`Amount (${currency})`]: fmt(totals.investment) },
    { Category: 'Net (Income − Expense − Saving − Investment)', [`Amount (${currency})`]: fmt(totals.income - totals.expense - totals.saving - totals.investment) },
    { Category: '', [`Amount (${currency})`]: '' },
    { Category: 'Top Spending Categories', [`Amount (${currency})`]: '' },
    ...topCategories.map(([cat, amt]) => ({ Category: `  ${cat}`, [`Amount (${currency})`]: fmt(amt) })),
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
