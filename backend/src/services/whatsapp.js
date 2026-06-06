import axios from 'axios';
import { config } from '../config.js';

const BASE = 'https://graph.facebook.com/v20.0';

export async function sendText(to, body) {
  await axios.post(
    `${BASE}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    },
    { headers: { Authorization: `Bearer ${config.WHATSAPP_TOKEN}` } }
  );
}

export async function downloadMedia(mediaId) {
  const { data: meta } = await axios.get(`${BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${config.WHATSAPP_TOKEN}` },
  });

  const { data: binary } = await axios.get(meta.url, {
    headers: { Authorization: `Bearer ${config.WHATSAPP_TOKEN}` },
    responseType: 'arraybuffer',
  });

  return { buffer: Buffer.from(binary), mimeType: meta.mime_type };
}

export function formatAmount(amount, currency = 'NGN') {
  const symbol = currency === 'NGN' ? '₦' : currency;
  return `${symbol}${Number(amount).toLocaleString('en-NG')}`;
}

export function confirmationMessage(record) {
  const amt = formatAmount(record.amount, record.currency);
  const emoji = record.direction === 'in' ? '💰' : '💸';
  const parts = [
    `${emoji} *Recorded* ${amt}`,
    record.category ? `— ${record.category}` : '',
    record.source ? `(${record.source})` : '',
  ].filter(Boolean).join(' ');

  const reviewNote = record.needs_review
    ? '\n⚠️ Low confidence — reply *edit* to correct.'
    : '\nReply *edit* to change.';

  return parts + reviewNote;
}
