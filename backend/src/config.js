import 'dotenv/config';

export const config = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  DAILY_THRESHOLD_DEFAULT: parseFloat(process.env.DAILY_THRESHOLD_DEFAULT || '10000'),
  PORT: parseInt(process.env.PORT || '3000', 10),
  TZ: process.env.TZ || 'Africa/Lagos',
};

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'GROQ_API_KEY'];
for (const key of required) {
  if (!config[key]) console.warn(`⚠️  Missing env var: ${key}`);
}
