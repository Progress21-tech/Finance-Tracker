import { z } from 'zod';

export const TransactionRecordSchema = z.object({
  direction: z.enum(['in', 'out']),
  bucket: z.enum(['expense', 'income', 'saving', 'investment']),
  amount: z.number().nonnegative(),
  currency: z.string().min(1).default('NGN'),
  category: z.string().default(''),
  source: z.string().default(''),
  remark: z.string().default(''),
  occurred_at: z.string().default(() => new Date().toISOString()),
  confidence: z.number().min(0).max(1).default(1),
  needs_review: z.boolean().default(false),
});

export function validateTransaction(raw) {
  const result = TransactionRecordSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
  return { ok: false, issues };
}

export const DIRECTION_VALUES = ['in', 'out'];
export const BUCKET_VALUES = ['expense', 'income', 'saving', 'investment'];
export const CHANNEL_VALUES = [
  'whatsapp_text', 'whatsapp_voice',
  'telegram_text', 'telegram_voice',
  'alert', 'statement', 'manual',
];
