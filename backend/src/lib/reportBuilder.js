import { createRequire } from 'module';
import * as XLSX from 'xlsx';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// ── Shared aggregation helpers ────────────────────────────────────────────────

export function aggregateTotals(txs) {
  const totals = { income: 0, expense: 0, saving: 0, investment: 0 };
  for (const tx of txs) totals[tx.bucket] = (totals[tx.bucket] ?? 0) + tx.amount;
  return totals;
}

export function topCategories(txs, n = 5) {
  const map = {};
  for (const tx of txs) {
    if (tx.bucket === 'expense') map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

export function buildXlsx(txs, totals, topCats, periodLabel, currency = 'NGN') {
  const wb = XLSX.utils.book_new();
  const fmt = n => Number(n).toFixed(2);

  // Transactions sheet
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
  txSheet['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 },
    { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // Summary sheet
  const net = totals.income - totals.expense - totals.saving - totals.investment;
  const summaryRows = [
    { Category: `${periodLabel} — Summary`, [`Amount (${currency})`]: '' },
    { Category: '', [`Amount (${currency})`]: '' },
    { Category: 'Total Income',     [`Amount (${currency})`]: fmt(totals.income) },
    { Category: 'Total Expenses',   [`Amount (${currency})`]: fmt(totals.expense) },
    { Category: 'Total Saved',      [`Amount (${currency})`]: fmt(totals.saving) },
    { Category: 'Total Invested',   [`Amount (${currency})`]: fmt(totals.investment) },
    { Category: 'Net',              [`Amount (${currency})`]: fmt(net) },
    { Category: '', [`Amount (${currency})`]: '' },
    { Category: 'Top Spending Categories', [`Amount (${currency})`]: '' },
    ...topCats.map(([cat, amt]) => ({ Category: `  ${cat}`, [`Amount (${currency})`]: fmt(amt) })),
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 42 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export function buildPdf(txs, totals, topCats, periodLabel, currency = 'NGN') {
  const fmt = n => `${currency} ${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const net = totals.income - totals.expense - totals.saving - totals.investment;

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks = [];
  doc.on('data', c => chunks.push(c));

  const pageW = doc.page.width - 100;

  // Header
  doc.fontSize(22).font('Helvetica-Bold').text('Finance Report', { align: 'center' });
  doc.fontSize(13).font('Helvetica').fillColor('#555').text(periodLabel, { align: 'center' });
  doc.fillColor('#000').moveDown(1.5);

  // Summary box
  doc.fontSize(13).font('Helvetica-Bold').text('Summary');
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(11);
  const rows = [
    ['Total Income',    fmt(totals.income)],
    ['Total Expenses',  fmt(totals.expense)],
    ['Total Saved',     fmt(totals.saving)],
    ['Total Invested',  fmt(totals.investment)],
    ['Net',             fmt(net)],
  ];
  for (const [label, value] of rows) {
    const y = doc.y;
    doc.text(label, 50, y);
    doc.text(value, 50, y, { align: 'right', width: pageW });
    doc.moveDown(0.35);
  }
  doc.moveDown(1);

  // Top categories
  if (topCats.length) {
    doc.fontSize(13).font('Helvetica-Bold').text('Top Spending Categories');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(11);
    for (const [cat, amt] of topCats) {
      const y = doc.y;
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 50, y);
      doc.text(fmt(amt), 50, y, { align: 'right', width: pageW });
      doc.moveDown(0.35);
    }
    doc.moveDown(1);
  }

  // Transactions table
  if (txs.length) {
    doc.fontSize(13).font('Helvetica-Bold').text('Transactions');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);

    // Column header
    const cols = { date: 50, dir: 120, cat: 155, amount: 320, source: 390 };
    doc.fillColor('#888')
      .text('Date',      cols.date,   doc.y, { continued: true })
      .text('Dir',       cols.dir,    doc.y, { continued: true })
      .text('Category',  cols.cat,    doc.y, { continued: true })
      .text('Amount',    cols.amount, doc.y, { continued: true })
      .text('Source',    cols.source, doc.y);
    doc.fillColor('#000').moveDown(0.3);

    for (const tx of txs) {
      if (doc.y > doc.page.height - 80) doc.addPage();
      const y = doc.y;
      doc.text(new Date(tx.occurred_at).toLocaleDateString('en-NG'), cols.date,   y, { width: 65 });
      doc.text(tx.direction === 'in' ? 'CR' : 'DR',                  cols.dir,   y, { width: 30 });
      doc.text(tx.category || '-',                                    cols.cat,   y, { width: 160 });
      doc.text(fmt(tx.amount),                                        cols.amount,y, { width: 65 });
      doc.text((tx.source || tx.remark || '').slice(0, 30),          cols.source,y, { width: 140 });
      doc.moveDown(0.3);
    }
  }

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
