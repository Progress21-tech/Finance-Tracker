import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { validateTransaction } from './validator.js';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a financial transaction parser for a Nigerian personal finance tracker.

Parse the user's raw input into a strict JSON record. Return ONLY the JSON object — no prose, no markdown fences, no extra text.

Required JSON schema:
{
  "direction": "in" | "out",
  "bucket": "expense" | "income" | "saving" | "investment",
  "amount": number (always positive; 0 if unknown),
  "currency": string (default "NGN"),
  "category": string (e.g. "fuel", "food", "rent", "salary", "freelance", "transfer", "crypto"),
  "source": string (merchant/payee for expenses; sender/payer for income; empty string if unknown),
  "remark": string (preserve user's words as a note; empty string if none),
  "occurred_at": string (ISO 8601 datetime; use the current time if not specified),
  "confidence": number (0.0–1.0; your confidence in the parse accuracy),
  "needs_review": boolean (true if amount is missing/ambiguous, or intent is unclear)
}

Parsing rules:
1. Nigerian shorthand: "5k"=5000, "2.5m"=2500000, "500k"=500000, "1.2b"=1200000000
2. Direction logic:
   - "spent", "paid", "bought", "debited", "withdrew", "sent" → "out"
   - "received", "got", "credited", "earned", "salary", "paid me" → "in"
   - "moved to savings", "saved", "put in savings" → direction "out", bucket "saving"
3. Bucket logic:
   - Everyday spending (food, fuel, bills, transport, etc.) → "expense"
   - Money received (salary, payment, gift, transfer in) → "income"
   - Moving money to a savings wallet/account/piggybank → "saving"
   - Buying stocks, crypto, USDT, forex, real estate → "investment"
4. "moved 50k to savings" → { direction:"out", bucket:"saving", amount:50000 }
5. "bought 100k of USDT" → { direction:"out", bucket:"investment", amount:100000, category:"crypto" }
6. Bank alert phrases:
   - "Your Acct was debited" → direction "out", extract amount, payee, date
   - "Your Acct was credited" → direction "in", extract amount, source, date
   - Narration field often contains payee/purpose — use it as category and source
7. Default currency to "NGN" unless another currency symbol ($ £ €) or code (USD, GBP) appears
8. If amount is 0 or cannot be determined → needs_review:true, confidence:0.1
9. Dates: if a partial date like "12 May" is given, combine with the current year
10. Be robust to typos, abbreviations, and casual Nigerian English`;

function fallbackRecord(rawText, now) {
  return {
    direction: 'out',
    bucket: 'expense',
    amount: 0,
    currency: 'NGN',
    category: '',
    source: '',
    remark: rawText,
    occurred_at: now,
    confidence: 0,
    needs_review: true,
  };
}

export async function parseToRecord(rawText, context = {}) {
  const now = context.now ?? new Date().toISOString();

  let rawJson;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Current time: ${now}\n\n${rawText}`,
        },
      ],
    });
    rawJson = message.content[0].text.trim();
  } catch (err) {
    console.error('[parseToRecord] Claude API error:', err.message);
    return fallbackRecord(rawText, now);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    console.error('[parseToRecord] JSON parse failed. Raw output:', rawJson);
    return fallbackRecord(rawText, now);
  }

  const validation = validateTransaction(parsed);
  if (!validation.ok) {
    console.warn('[parseToRecord] Validation issues:', validation.issues);
    return {
      ...fallbackRecord(rawText, now),
      ...parsed,
      needs_review: true,
      confidence: Math.min(parsed.confidence ?? 0.3, 0.5),
    };
  }

  return validation.data;
}

export async function parseStatementRows(chunkText, context = {}) {
  const now = context.now ?? new Date().toISOString();

  const STATEMENT_PROMPT = `You are a bank statement parser. Given a chunk of bank statement rows, return a JSON array of transaction records.

Each item in the array must match this schema:
{
  "direction": "in" | "out",
  "bucket": "expense" | "income" | "saving" | "investment",
  "amount": number (always positive),
  "currency": string (default "NGN"),
  "category": string,
  "source": string,
  "remark": string,
  "occurred_at": string (ISO 8601),
  "confidence": number (0–1),
  "needs_review": boolean
}

Apply the same Nigerian shorthand and parsing rules as for single transactions.
Return ONLY the JSON array — no prose, no fences.
If a row is unclear, include it with needs_review:true and confidence below 0.5.`;

  let rawJson;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [{ type: 'text', text: STATEMENT_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Current time: ${now}\n\n${chunkText}` }],
    });
    rawJson = message.content[0].text.trim();
  } catch (err) {
    console.error('[parseStatementRows] Claude API error:', err.message);
    return [];
  }

  try {
    const records = JSON.parse(rawJson);
    if (!Array.isArray(records)) return [];
    return records.map(r => {
      const v = validateTransaction(r);
      return v.ok ? v.data : { ...fallbackRecord('', now), ...r, needs_review: true };
    });
  } catch {
    console.error('[parseStatementRows] JSON parse failed. Raw:', rawJson?.slice(0, 200));
    return [];
  }
}
