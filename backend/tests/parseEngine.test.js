/**
 * Parse Engine test — run with: npm run test:parse
 * Tests all example inputs from the project spec (§6) plus edge cases.
 */

import { parseToRecord } from '../src/engine/parseRecord.js';

const inputs = [
  // ── §6 spec examples ──────────────────────────────────────────────────────
  {
    label: 'Basic expense',
    text: 'spent 5k on fuel',
    expect: { direction: 'out', bucket: 'expense', amount: 5000, category: 'fuel' },
  },
  {
    label: 'Income with source',
    text: 'got 250k salary from ProbeTech',
    expect: { direction: 'in', bucket: 'income', amount: 250000, source: 'ProbeTech' },
  },
  {
    label: 'Savings transfer',
    text: 'moved 50k to savings',
    expect: { direction: 'out', bucket: 'saving', amount: 50000 },
  },
  {
    label: 'Crypto investment',
    text: 'bought 100k of USDT',
    expect: { direction: 'out', bucket: 'investment', amount: 100000 },
  },
  {
    label: 'GTBank debit alert',
    text: 'Your Acct ****1234 was debited N5,000.00 on 12-May-25; Ref:GTXXXXXX. To query, call 0700GTCONNECT',
    expect: { direction: 'out', bucket: 'expense', amount: 5000 },
  },
  // ── Additional edge cases ─────────────────────────────────────────────────
  {
    label: 'Food shorthand',
    text: 'paid 2.5k for lunch',
    expect: { direction: 'out', bucket: 'expense', amount: 2500 },
  },
  {
    label: 'Freelance income',
    text: 'received 150k from a client for a design job',
    expect: { direction: 'in', bucket: 'income', amount: 150000 },
  },
  {
    label: 'Rent payment',
    text: 'paid 500k rent for the apartment',
    expect: { direction: 'out', bucket: 'expense', amount: 500000, category: 'rent' },
  },
  {
    label: 'Stock investment',
    text: 'bought NGX stocks worth 200k',
    expect: { direction: 'out', bucket: 'investment', amount: 200000 },
  },
  {
    label: 'GTBank credit alert',
    text: 'Your Acct ****5678 was credited N50,000.00 on 05-Jun-25; Ref:GTXXXXXX',
    expect: { direction: 'in', amount: 50000 },
  },
  {
    label: 'Casual typo',
    text: 'spendt 3500 on transport',
    expect: { direction: 'out', bucket: 'expense', amount: 3500 },
  },
  {
    label: 'Airtime',
    text: '1k airtime',
    expect: { direction: 'out', bucket: 'expense', amount: 1000 },
  },
];

let passed = 0;
let failed = 0;

console.log('\n============================');
console.log('  Finance Tracker — Parse Engine Test');
console.log('============================\n');

for (const tc of inputs) {
  process.stdout.write(`Testing: "${tc.label}" ... `);

  let record;
  try {
    record = await parseToRecord(tc.text);
  } catch (err) {
    console.log('ERROR');
    console.error(`  ↳ ${err.message}`);
    failed++;
    continue;
  }

  const failures = [];
  for (const [key, expectedVal] of Object.entries(tc.expect)) {
    const actual = record[key];
    if (String(actual).toLowerCase() !== String(expectedVal).toLowerCase()) {
      failures.push(`  ${key}: expected "${expectedVal}", got "${actual}"`);
    }
  }

  if (failures.length === 0) {
    console.log('PASS');
    console.log(`  ↳ direction:${record.direction}  bucket:${record.bucket}  amount:${record.amount}  confidence:${record.confidence.toFixed(2)}`);
    passed++;
  } else {
    console.log('FAIL');
    failures.forEach(f => console.log(f));
    console.log(`  ↳ Full record: ${JSON.stringify(record)}`);
    failed++;
  }
}

console.log('\n────────────────────────────');
console.log(`Results: ${passed} passed / ${failed} failed / ${inputs.length} total`);
console.log('────────────────────────────\n');

if (failed > 0) process.exit(1);
