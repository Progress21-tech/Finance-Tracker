/**
 * Bank alert pre-extractors.
 *
 * Each extractor tries to pull: direction, amount, currency, source, balance, occurred_at
 * from a Nigerian bank SMS/email alert. This structured output is appended to the raw
 * text before sending to Claude, raising parse confidence without replacing Claude.
 */

const NGN_AMOUNT = /(?:NGN|N|₦)\s*([\d,]+(?:\.\d{1,2})?)/i;
const PLAIN_AMOUNT = /([\d,]+(?:\.\d{1,2})?)/;

function parseAmount(str) {
  if (!str) return null;
  return parseFloat(str.replace(/,/g, ''));
}

function parseNGNAmount(text) {
  const m = NGN_AMOUNT.exec(text);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

function normaliseDate(raw) {
  if (!raw) return null;
  // Formats: "12-May-25", "12/05/2025", "12-05-2025", "05/12/2025"
  const monthNames = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const mDMY = /(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})/.exec(raw);
  if (mDMY) {
    const year = mDMY[3].length === 2 ? 2000 + parseInt(mDMY[3]) : parseInt(mDMY[3]);
    const month = monthNames[mDMY[2].toLowerCase().slice(0, 3)];
    return new Date(year, month, parseInt(mDMY[1])).toISOString();
  }
  const mSlash = /(\d{2})\/(\d{2})\/(\d{4})/.exec(raw);
  if (mSlash) return new Date(`${mSlash[3]}-${mSlash[2]}-${mSlash[1]}`).toISOString();
  return null;
}

// ── GTBank ───────────────────────────────────────────────────────────────────
// Debit: "Your Acct ****1234 was debited N5,000.00 on 12-May-25; Ref:GT..."
// Credit: "Your Acct ****1234 was credited N50,000.00 on 12-May-25; Ref:GT..."
function gtbank(text) {
  const isDebit = /was debited/i.test(text);
  const isCredit = /was credited/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /on\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})/i.exec(text);
  const narM = /Narr(?:ation)?[:\s]+([^;.\n]+)/i.exec(text);

  return {
    bank: 'GTBank',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: narM ? narM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── Access Bank ──────────────────────────────────────────────────────────────
// "Dear Customer, Your account XXXXXXXX1234 has been debited with NGN 5,000.00 on 12/05/2025"
function accessBank(text) {
  if (!/access/i.test(text) && !/dear customer/i.test(text)) return null;
  const isDebit = /has been debited/i.test(text);
  const isCredit = /has been credited/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /on\s+(\d{2}\/\d{2}\/\d{4})/i.exec(text);
  const narM = /Narration[:\s]+([^.\n]+)/i.exec(text);

  return {
    bank: 'Access Bank',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: narM ? narM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── UBA ──────────────────────────────────────────────────────────────────────
// "UBA Alert: Dr N5,000.00 12-05-2025 TRANSFER TO JOHN"
// "UBA Alert: Cr N50,000.00 12-05-2025 SALARY"
function uba(text) {
  if (!/uba alert/i.test(text)) return null;
  const isDebit = /\bDr\b/i.test(text);
  const isCredit = /\bCr\b/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /(\d{2}-\d{2}-\d{4})/.exec(text);
  const narM = /\d{2}-\d{2}-\d{4}\s+(.+)$/.exec(text);

  return {
    bank: 'UBA',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: narM ? narM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── First Bank ───────────────────────────────────────────────────────────────
// "FBN Alert: Debit of N5,000.00 to JOHN DOE on 12/05/2025. Balance: N40,000.00"
function firstBank(text) {
  if (!/fbn alert/i.test(text)) return null;
  const isDebit = /debit of/i.test(text);
  const isCredit = /credit of/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /on\s+(\d{2}\/\d{2}\/\d{4})/i.exec(text);
  const partyM = isDebit ? /debit of[^t]+to\s+([^o]+)on/i.exec(text) : /credit from\s+([^o]+)on/i.exec(text);

  return {
    bank: 'First Bank',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: partyM ? partyM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── OPay ─────────────────────────────────────────────────────────────────────
// "OPay Debit Alert: N5,000.00 debited from your OPay account on 12-May-25. Recipient: JOHN DOE"
// "OPay Credit Alert: N50,000.00 credited to your account on 12-May-25. Sender: JANE"
function opay(text) {
  if (!/opay/i.test(text)) return null;
  const isDebit = /debit alert/i.test(text) || /debited from/i.test(text);
  const isCredit = /credit alert/i.test(text) || /credited to/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /on\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})/i.exec(text);
  const senderM = /(?:Recipient|Sender|To|From)[:\s]+([^\n.]+)/i.exec(text);

  return {
    bank: 'OPay',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: senderM ? senderM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── Kuda ─────────────────────────────────────────────────────────────────────
// "Kuda: N5,000.00 was sent to JOHN DOE from your Kuda account on 12-May-25. New balance: N40,000.00"
// "Kuda: N50,000.00 was received from JANE to your Kuda account on 12-May-25."
function kuda(text) {
  if (!/kuda/i.test(text)) return null;
  const isDebit = /was sent to/i.test(text) || /sent from your kuda/i.test(text);
  const isCredit = /was received/i.test(text) || /received from/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /on\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})/i.exec(text);
  const partyM = isDebit ? /was sent to\s+([^\n]+?)(?:from|on)/i.exec(text) : /received from\s+([^\n]+?)(?:to|on)/i.exec(text);

  return {
    bank: 'Kuda',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: partyM ? partyM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

// ── Zenith Bank ──────────────────────────────────────────────────────────────
// "Zenith Bank Alert: Debit of N5,000.00 | REF:XXXXX | to JOHN DOE | 12/05/2025"
function zenith(text) {
  if (!/zenith/i.test(text)) return null;
  const isDebit = /debit of/i.test(text);
  const isCredit = /credit of/i.test(text);
  if (!isDebit && !isCredit) return null;

  const amount = parseNGNAmount(text);
  const dateM = /(\d{2}\/\d{2}\/\d{4})/.exec(text);
  const partyM = /(?:to|from)\s+([^|]+)/i.exec(text);

  return {
    bank: 'Zenith Bank',
    direction: isDebit ? 'out' : 'in',
    amount,
    currency: 'NGN',
    source: partyM ? partyM[1].trim() : '',
    occurred_at: normaliseDate(dateM?.[1]) ?? new Date().toISOString(),
  };
}

const EXTRACTORS = [gtbank, accessBank, uba, firstBank, opay, kuda, zenith];

export function preExtractAlert(text) {
  for (const extractor of EXTRACTORS) {
    const result = extractor(text);
    if (result) return result;
  }
  return null;
}

export function enrichPromptWithAlert(rawText, extracted) {
  if (!extracted) return rawText;
  const hints = [
    `[Pre-extracted from ${extracted.bank} alert]`,
    `Direction: ${extracted.direction}`,
    `Amount: ${extracted.amount ?? 'unknown'}`,
    `Currency: ${extracted.currency}`,
    extracted.source ? `Source/Payee: ${extracted.source}` : null,
    `Date: ${extracted.occurred_at}`,
    `---`,
    `Original alert:`,
    rawText,
  ].filter(Boolean).join('\n');
  return hints;
}
