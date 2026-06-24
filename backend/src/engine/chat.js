import Groq from 'groq-sdk';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';
import { parseAndStore } from './processMessage.js';
import { formatAmount } from '../services/whatsapp.js';
import { aggregateTotals, topCategories } from '../lib/reportBuilder.js';
import { resolveMonth } from '../lib/periods.js';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';
const HISTORY_LIMIT = 10;
const INTENTS = ['record_transaction', 'query_data', 'request_report', 'general_conversation'];
const sessionHistory = new Map();

const QUILLIO_SYSTEM_PROMPT = `You are Quillio, a warm, clear AI finance assistant for Nigerian users.
Quillio helps users record transactions, understand their money, review budgets, and generate reports.
Use Nigerian Naira by default. Format NGN amounts with the \u20a6 symbol and comma separators.
Be conversational, specific, and concise. Do not invent data. If the needed data is missing, say that plainly.`;

const INTENT_PROMPT = `Classify the latest user message for Quillio into exactly one intent:
- record_transaction: recording an expense, income, saving, or investment.
- query_data: asking about existing financial data, totals, balances, categories, budgets, or recent transactions.
- request_report: asking for a report, summary, monthly report, export, PDF, or spreadsheet.
- general_conversation: greetings, help, product questions, or anything else.

Return only JSON like {"intent":"query_data"}.`;

const QUERY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description: 'Get income, expense, saving, investment, and net balance for a period. Defaults to current month.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'this_month, last_month, today, this_week, last_7_days, last_30_days, ytd, all_time, or YYYY-MM',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_by_category',
      description: 'Get expense totals by category, or one category total, for a period.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional category such as food, fuel, transport, rent.' },
          period: { type: 'string', description: 'Optional period. Defaults to current month.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Get the latest transactions for the user.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'How many transactions to return. Defaults to 10, maximum 25.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_summary',
      description: 'Get total earned, spent, saved, invested, top categories, and net for a specific month.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Month number 1-12. Defaults to current month.' },
          year: { type: 'number', description: 'Four-digit year. Defaults to current year.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: "Compare today's spending to the user's daily threshold and estimate monthly burn rate.",
      parameters: { type: 'object', properties: {} },
    },
  },
];

function stripFences(text = '') {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function safeJson(text, fallback = {}) {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    return fallback;
  }
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-HISTORY_LIMIT);
}

function getHistory(sessionKey, incomingHistory) {
  const fromClient = normalizeHistory(incomingHistory);
  if (fromClient.length) {
    sessionHistory.set(sessionKey, fromClient);
    return fromClient;
  }
  return sessionHistory.get(sessionKey) ?? [];
}

function remember(sessionKey, history, userMessage, assistantMessage) {
  const next = [
    ...normalizeHistory(history),
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantMessage },
  ].slice(-HISTORY_LIMIT);
  sessionHistory.set(sessionKey, next);
  return next;
}

function fmt(amount, currency = 'NGN') {
  return formatAmount(Number(amount || 0), currency);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();
}

function resolveChatPeriod(period = 'this_month') {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const normalized = String(period || 'this_month').toLowerCase().trim();

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const range = resolveMonth(normalized);
    return { ...range, key: normalized };
  }

  switch (normalized) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now), label: 'today', key: 'today' };
    case 'this_week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: startOfDay(start), to: now.toISOString(), label: 'this week', key: 'this_week' };
    }
    case 'last_7_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { from: startOfDay(start), to: now.toISOString(), label: 'the last 7 days', key: 'last_7_days' };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { from: startOfDay(start), to: now.toISOString(), label: 'the last 30 days', key: 'last_30_days' };
    }
    case 'last_month':
      return {
        from: new Date(y, m - 1, 1).toISOString(),
        to: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
        label: new Date(y, m - 1, 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' }),
        key: 'last_month',
      };
    case 'ytd':
      return { from: new Date(y, 0, 1).toISOString(), to: now.toISOString(), label: 'this year', key: 'ytd' };
    case 'all_time':
      return { from: null, to: null, label: 'all time', key: 'all_time' };
    case 'this_month':
    default:
      return {
        from: new Date(y, m, 1).toISOString(),
        to: now.toISOString(),
        label: new Date(y, m, 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' }),
        key: 'this_month',
      };
  }
}

function withRange(query, range) {
  let q = query;
  if (range.from) q = q.gte('occurred_at', range.from);
  if (range.to) q = q.lte('occurred_at', range.to);
  return q;
}

async function loadTransactions(userId, range, columns = '*') {
  let q = supabase.from('transactions').select(columns).eq('user_id', userId);
  q = withRange(q, range);
  const { data, error } = await q.order('occurred_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function summarizeBuckets(txs) {
  const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
  for (const tx of txs) totals[tx.bucket] = (totals[tx.bucket] ?? 0) + Number(tx.amount || 0);
  return totals;
}

async function getBalance(user, args = {}) {
  const range = resolveChatPeriod(args.period);
  const txs = await loadTransactions(user.id, range, 'bucket, amount, occurred_at');
  const totals = summarizeBuckets(txs);
  return {
    type: 'balance',
    period: { key: range.key, label: range.label, from: range.from, to: range.to },
    totals,
    balance: totals.income - totals.expense,
    netCashFlow: totals.income - totals.expense - totals.saving - totals.investment,
    currency: user.currency ?? 'NGN',
    txCount: txs.length,
  };
}

async function getSpendingByCategory(user, args = {}) {
  const range = resolveChatPeriod(args.period);
  let q = supabase
    .from('transactions')
    .select('category, amount, occurred_at')
    .eq('user_id', user.id)
    .eq('bucket', 'expense');

  q = withRange(q, range);
  if (args.category) q = q.ilike('category', `%${args.category}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const categoryTotals = {};
  for (const tx of data ?? []) {
    const key = tx.category || 'uncategorised';
    categoryTotals[key] = (categoryTotals[key] ?? 0) + Number(tx.amount || 0);
  }

  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));

  return {
    type: 'spending_by_category',
    period: { key: range.key, label: range.label, from: range.from, to: range.to },
    category: args.category ?? null,
    total: categories.reduce((sum, item) => sum + item.amount, 0),
    categories,
    currency: user.currency ?? 'NGN',
    txCount: data?.length ?? 0,
  };
}

async function getRecentTransactions(user, args = {}) {
  const limit = Math.min(Math.max(Number(args.limit ?? 10), 1), 25);
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return {
    type: 'recent_transactions',
    transactions: data ?? [],
    limit,
    currency: user.currency ?? 'NGN',
    txCount: data?.length ?? 0,
  };
}

async function getMonthlySummary(user, args = {}) {
  const now = new Date();
  const month = Math.min(Math.max(Number(args.month ?? now.getMonth() + 1), 1), 12);
  const year = Number(args.year ?? now.getFullYear());
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const range = resolveMonth(monthKey);
  const txs = await loadTransactions(user.id, { ...range, key: monthKey });
  const totals = summarizeBuckets(txs);
  const topCats = topCategories(txs, 5).map(([category, amount]) => ({ category, amount }));

  return {
    type: 'monthly_summary',
    month: monthKey,
    label: range.label,
    period: { from: range.from, to: range.to },
    totals,
    net: totals.income - totals.expense - totals.saving - totals.investment,
    savingsRate: totals.income > 0 ? Math.round(((totals.saving + totals.investment) / totals.income) * 100) : 0,
    topCategories: topCats,
    currency: user.currency ?? 'NGN',
    txCount: txs.length,
  };
}

async function getBudgetStatus(user) {
  const now = new Date();
  const todayRange = resolveChatPeriod('today');
  const monthRange = resolveChatPeriod('this_month');

  const [todayTxs, monthTxs] = await Promise.all([
    loadTransactions(user.id, todayRange, 'bucket, amount'),
    loadTransactions(user.id, monthRange, 'bucket, amount'),
  ]);

  const todaySpent = todayTxs
    .filter(tx => tx.bucket === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const monthSpent = monthTxs
    .filter(tx => tx.bucket === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const averageDailySpend = dayOfMonth > 0 ? monthSpent / dayOfMonth : monthSpent;
  const projectedMonthlySpend = averageDailySpend * daysInMonth;
  const threshold = Number(user.daily_threshold ?? 0);

  return {
    type: 'budget_status',
    dailyThreshold: threshold,
    todaySpent,
    todayRemaining: Math.max(threshold - todaySpent, 0),
    todayOverBy: Math.max(todaySpent - threshold, 0),
    monthSpent,
    averageDailySpend,
    projectedMonthlySpend,
    currency: user.currency ?? 'NGN',
    isOverDailyThreshold: threshold > 0 && todaySpent > threshold,
  };
}

async function executeTool(user, name, args = {}) {
  switch (name) {
    case 'get_balance':
      return getBalance(user, args);
    case 'get_spending_by_category':
      return getSpendingByCategory(user, args);
    case 'get_recent_transactions':
      return getRecentTransactions(user, args);
    case 'get_monthly_summary':
      return getMonthlySummary(user, args);
    case 'get_budget_status':
      return getBudgetStatus(user);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function classifyIntent(message, history) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 80,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTENT_PROMPT },
        ...history,
        { role: 'user', content: message },
      ],
    });
    const parsed = safeJson(completion.choices[0].message.content, {});
    return INTENTS.includes(parsed.intent) ? parsed.intent : 'general_conversation';
  } catch (err) {
    console.error('[chat] intent classification failed:', err.message);
    return heuristicIntent(message);
  }
}

function heuristicIntent(message) {
  const text = message.toLowerCase();
  if (/\b(spent|paid|bought|got|received|earned|salary|saved|moved|debited|credited|sent)\b/.test(text) && /\d/.test(text)) {
    return 'record_transaction';
  }
  if (/\b(report|summary|export|spreadsheet|xlsx|pdf)\b/.test(text)) return 'request_report';
  if (/\b(balance|spend|spent|category|categories|transactions?|budget|threshold|earned|income|saved|invested|last month|this month)\b/.test(text)) {
    return 'query_data';
  }
  return 'general_conversation';
}

async function generateGeneralReply(message, history) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 500,
    messages: [
      { role: 'system', content: QUILLIO_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ],
  });
  return completion.choices[0].message.content?.trim() || 'I am here. Tell me what you want to record or understand about your money.';
}

async function answerDataQuery(user, message, history) {
  const messages = [
    {
      role: 'system',
      content: `${QUILLIO_SYSTEM_PROMPT}
Use the provided finance tools to answer questions about the user's data. Always call a tool before answering data questions.
When you answer, mention the period used and the key numbers. Keep it brief.`,
    },
    ...history,
    { role: 'user', content: message },
  ];

  const first = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 700,
    messages,
    tools: QUERY_TOOLS,
    tool_choice: 'auto',
  });

  const assistant = first.choices[0].message;
  const calls = assistant.tool_calls ?? [];

  if (!calls.length) {
    const fallback = await getBalance(user);
    return {
      message: assistant.content?.trim() || `Your balance this month is ${fmt(fallback.balance, fallback.currency)}.`,
      data: { toolResults: [{ name: 'get_balance', arguments: {}, result: fallback }] },
    };
  }

  const toolMessages = [];
  const toolResults = [];

  for (const call of calls) {
    const name = call.function?.name;
    const args = safeJson(call.function?.arguments, {});
    const result = await executeTool(user, name, args);
    toolResults.push({ name, arguments: args, result });
    toolMessages.push({
      role: 'tool',
      tool_call_id: call.id,
      name,
      content: JSON.stringify(result),
    });
  }

  const final = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 700,
    messages: [...messages, assistant, ...toolMessages],
  });

  return {
    message: final.choices[0].message.content?.trim() || 'I found your numbers, but could not turn them into a reply.',
    data: { toolResults },
  };
}

function reportMonthFromMessage(message) {
  const text = message.toLowerCase();
  const now = new Date();
  if (text.includes('last month')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const explicit = /\b(20\d{2})-(0[1-9]|1[0-2])\b/.exec(text);
  if (explicit) return explicit[0];
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function buildReportResponse(user, message) {
  const month = reportMonthFromMessage(message);
  const range = resolveMonth(month);
  const txs = await loadTransactions(user.id, { ...range, key: month });
  const totals = aggregateTotals(txs);
  const topCats = topCategories(txs, 5).map(([category, amount]) => ({ category, amount }));
  const net = totals.income - totals.expense - totals.saving - totals.investment;
  const savingsRate = totals.income > 0 ? Math.round(((totals.saving + totals.investment) / totals.income) * 100) : 0;
  const currency = user.currency ?? 'NGN';

  const data = {
    type: 'monthly_report',
    month,
    label: range.label,
    period: { from: range.from, to: range.to },
    totals,
    net,
    savingsRate,
    topCategories: topCats,
    currency,
    txCount: txs.length,
  };

  const messageText = txs.length
    ? `${range.label} report: you earned ${fmt(totals.income, currency)}, spent ${fmt(totals.expense, currency)}, saved ${fmt(totals.saving, currency)}, and invested ${fmt(totals.investment, currency)}. Net cash flow was ${fmt(net, currency)} across ${txs.length} transaction${txs.length === 1 ? '' : 's'}.`
    : `No transactions recorded for ${range.label} yet.`;

  return { message: messageText, data };
}

export async function handleChatMessage({
  user,
  message,
  channel = 'manual',
  sessionId = 'default',
  history: incomingHistory = [],
}) {
  if (!message?.trim()) {
    return { intent: 'general_conversation', message: 'Send me a message to record or ask about your money.', data: null, transaction: null };
  }

  const sessionKey = `${channel}:${user.id}:${sessionId}`;
  const history = getHistory(sessionKey, incomingHistory);
  const text = message.trim();
  const intent = await classifyIntent(text, history);

  let response;

  if (intent === 'record_transaction') {
    const { record, transaction, error } = await parseAndStore(text, user.id, channel);
    if (error === 'zero_amount') {
      response = {
        intent,
        message: "I couldn't figure out the amount. Try something like: spent 5k on fuel.",
        data: { error },
        transaction: null,
      };
    } else if (error) {
      response = {
        intent,
        message: error === 'db_error'
          ? 'I understood that, but there was an error saving it. Please try again.'
          : "Sorry, I couldn't parse that transaction clearly. Try rephrasing it with an amount.",
        data: { error },
        transaction: null,
      };
    } else {
      response = {
        intent,
        message: `Recorded ${fmt(record.amount, record.currency)}${record.category ? ` for ${record.category}` : ''}.`,
        data: null,
        transaction,
      };
    }
  } else if (intent === 'query_data') {
    const answer = await answerDataQuery(user, text, history);
    response = { intent, message: answer.message, data: answer.data, transaction: null };
  } else if (intent === 'request_report') {
    const report = await buildReportResponse(user, text);
    response = { intent, message: report.message, data: report.data, transaction: null };
  } else {
    const answer = await generateGeneralReply(text, history);
    response = { intent, message: answer, data: null, transaction: null };
  }

  response.history = remember(sessionKey, history, text, response.message);
  return response;
}

export function getConversationHistory({ user, channel = 'manual', sessionId = 'default' }) {
  return sessionHistory.get(`${channel}:${user.id}:${sessionId}`) ?? [];
}
