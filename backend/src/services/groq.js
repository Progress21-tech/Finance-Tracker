import Groq, { toFile } from 'groq-sdk';
import { config } from '../config.js';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

export async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg') {
  const ext = mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
    : mimeType.includes('webm') ? 'webm'
    : 'ogg';

  const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
    response_format: 'json',
  });

  return transcription.text?.trim() ?? '';
}
