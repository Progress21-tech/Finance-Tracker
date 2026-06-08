# Finance Tracker — Backend

## Setup

1. `cp .env.example .env` and fill in all values.
2. Run `schema.sql` in the Supabase SQL editor (includes the Telegram migration block at the bottom).
3. Create a private `statements` bucket in Supabase Storage.
4. `npm install`
5. `npm run test:parse` — verify the Claude parse engine passes before wiring any channels.
6. `npm start` (or `npm run dev` for watch mode).

---

## Registering the Telegram webhook

Telegram delivers messages by calling your server, so you must tell it where to send updates.

**1. Create a bot**
Talk to [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`, and copy the token into `TELEGRAM_BOT_TOKEN` in your `.env`.

**2. Register the webhook URL**
Run this once after deploying (replace the placeholders):

```
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_RENDER_URL>/telegram/webhook"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

**3. Verify it's registered**
```
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**4. Register a user**
Add `telegram_chat_id` to the user's row in Supabase. The chat ID is the numeric `message.chat.id` that Telegram sends with every message — you can read it from the server logs on first contact, or ask the user to message [@userinfobot](https://t.me/userinfobot).

**Local development**
Use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.me) to expose your local server, then register that URL as the webhook.

---

## Channels

| Channel | Webhook path | Identified by |
|---|---|---|
| WhatsApp | `POST /webhook` | `users.whatsapp_number` |
| Telegram | `POST /telegram/webhook` | `users.telegram_chat_id` |
