import { createRequire } from 'module';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseStatementRows } from '../engine/parseRecord.js';
import { supabase } from '../db/supabase.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const CHUNK_SIZE = 30; // rows per Claude call

export async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'application/pdf' || mimeType === 'text/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return buffer.toString('utf-8');
  }

  // Excel
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(ws);
  }

  return buffer.toString('utf-8');
}

function chunkText(text, size = CHUNK_SIZE) {
  const lines = text.split('\n').filter(l => l.trim());
  const chunks = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size).join('\n'));
  }
  return chunks;
}

function isDuplicate(existing, candidate) {
  const sameAmount = Math.abs(existing.amount - candidate.amount) < 0.01;
  const sameDate = existing.occurred_at?.slice(0, 10) === candidate.occurred_at?.slice(0, 10);
  const sameSource = (existing.source || '').toLowerCase() === (candidate.source || '').toLowerCase();
  return sameAmount && sameDate && sameSource;
}

/**
 * Preview-only: extract + parse + dedupe, return rows without inserting.
 * Returns { rows, duplicateCount, totalParsed }.
 */
export async function processStatementSync(userId, buffer, mimeType) {
  const text = await extractTextFromBuffer(buffer, mimeType);
  const chunks = chunkText(text);
  const allParsed = [];

  for (const chunk of chunks) {
    const records = await parseStatementRows(chunk);
    allParsed.push(...records);
  }

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: existing } = await supabase
    .from('transactions')
    .select('amount, occurred_at, source')
    .eq('user_id', userId)
    .gte('occurred_at', threeMonthsAgo.toISOString());

  const rows = [];
  let duplicateCount = 0;

  for (const candidate of allParsed) {
    const isDup = (existing ?? []).some(ex => isDuplicate(ex, candidate));
    if (isDup) {
      duplicateCount++;
    } else {
      rows.push({
        direction: candidate.direction,
        bucket: candidate.bucket,
        amount: candidate.amount,
        currency: candidate.currency,
        category: candidate.category,
        source: candidate.source,
        remark: candidate.remark,
        occurred_at: candidate.occurred_at,
        confidence: candidate.confidence,
        needs_review: candidate.needs_review,
      });
    }
  }

  return { rows, duplicateCount, totalParsed: allParsed.length };
}

export async function processStatement(statementId, userId, buffer, mimeType) {
  await supabase
    .from('statements')
    .update({ status: 'processing' })
    .eq('id', statementId);

  let text;
  try {
    text = await extractTextFromBuffer(buffer, mimeType);
  } catch (err) {
    await supabase
      .from('statements')
      .update({ status: 'error', error_msg: `Text extraction failed: ${err.message}` })
      .eq('id', statementId);
    return;
  }

  const chunks = chunkText(text);
  const allParsed = [];

  for (const chunk of chunks) {
    const records = await parseStatementRows(chunk);
    allParsed.push(...records);
  }

  if (allParsed.length === 0) {
    await supabase
      .from('statements')
      .update({ status: 'error', error_msg: 'No transactions extracted from statement' })
      .eq('id', statementId);
    return;
  }

  // Load recent transactions for de-duplication (last 3 months of data)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: existing } = await supabase
    .from('transactions')
    .select('amount, occurred_at, source')
    .eq('user_id', userId)
    .gte('occurred_at', threeMonthsAgo.toISOString());

  const toInsert = allParsed.filter(
    candidate => !(existing ?? []).some(ex => isDuplicate(ex, candidate))
  );

  if (toInsert.length > 0) {
    const rows = toInsert.map(r => ({
      user_id: userId,
      direction: r.direction,
      bucket: r.bucket,
      amount: r.amount,
      currency: r.currency,
      category: r.category,
      source: r.source,
      remark: r.remark,
      channel: 'statement',
      occurred_at: r.occurred_at,
      raw_input: null,
      confidence: r.confidence,
      needs_review: r.needs_review,
    }));

    await supabase.from('transactions').insert(rows);
  }

  await supabase
    .from('statements')
    .update({ status: 'done', tx_count: toInsert.length })
    .eq('id', statementId);
}
