import axios from 'axios';
import { config } from '../config.js';

const base = () => `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId, text) {
  await axios.post(`${base()}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  });
}

export async function downloadTelegramFile(fileId) {
  // Step 1 — resolve the file_path from Telegram's servers
  const { data: info } = await axios.get(`${base()}/getFile`, {
    params: { file_id: fileId },
  });

  const filePath = info.result.file_path;
  // Telegram voice notes are always ogg/opus regardless of file extension (.oga)
  const mimeType = 'audio/ogg';

  // Step 2 — download the actual bytes
  const { data: binary } = await axios.get(
    `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${filePath}`,
    { responseType: 'arraybuffer' }
  );

  return { buffer: Buffer.from(binary), mimeType };
}
