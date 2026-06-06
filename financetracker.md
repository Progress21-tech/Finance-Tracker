# Personal AI Finance Tracker — Project Brief

> A WhatsApp-first, AI-powered personal finance tracker. Built to grow into a general-purpose life tracker. This document is the build spec for Claude Code.

---

## 1. Vision

A personal AI assistant for money. I talk to it on WhatsApp (text or voice notes), and it records every expense, income, saving, and investment into a structured database. It parses messy input ("spent 5k on fuel"), my bank transaction alerts, and uploaded bank statements into clean records. It warns me when I cross a daily spending threshold, and gives me a monthly report (spent / saved / invested / earned).

**Design principle:** The AI is the *parser*, not the database. Every input from any channel becomes structured JSON, gets validated, and is written to one flexible table. This is what lets the finance tracker become a life tracker later without a rewrite.

**Scope discipline:** Build the finance tracker first and well. Architect generically so "life tracker" modules (habits, health, tasks) can be added later as new categories/record types.

---

## 2. v1 Scope (build this first)

| Feature | In v1? | Notes |
|---|---|---|
| WhatsApp text input → recorded | ✅ | Core loop |
| WhatsApp voice note → transcribe → recorded | ✅ | Whisper/Groq |
| Manual entry / editing of any record | ✅ | Including remarks |
| Parse bank **alert** SMS/emails (forwarded) | ✅ | v1 bank-data method |
| Upload bank **statement** → AI analyses | ✅ | PDF/CSV |
| Daily threshold notification | ✅ | Cron + WhatsApp push |
| Income recording with source | ✅ | |
| Savings & investment recording | ✅ | As buckets |
| Monthly report (xlsx + summary) | ✅ | |
| Landing page | ✅ (low priority) | Build last |
| Live bank linking (Mono) | ❌ Phase 2 | Needs business KYC/approval |

**Bank data v1 = alert parsing + manual/voice entry.** No live bank API in v1.

---

## 3. Tech Stack

- **Backend:** Node.js + Express (ESM modules)
- **Database + Auth:** Supabase (Postgres)
- **AI:** Anthropic Claude API (parsing, categorization, statement analysis, report narration)
- **Transcription:** Groq Whisper endpoint (voice notes → text)
- **Messaging:** WhatsApp Cloud API (Meta) — webhook in/out
- **Scheduling:** cron job on Render (daily threshold check, monthly report)
- **Frontend (landing + optional dashboard):** Vite + React + TypeScript + Tailwind
- **Hosting:** Backend on Render, frontend on Vercel
- **Reports:** `xlsx` (SheetJS) for spreadsheet export

---

## 4. Architecture

```
                ┌─────────────────────────────┐
   WhatsApp ───▶│  /webhook (Express)         │
   (text/voice) │   - verify Meta signature   │
                │   - if voice: download audio │──▶ Groq Whisper ──▶ text
                └──────────────┬──────────────┘
                               │ raw text / statement
                               ▼
                ┌─────────────────────────────┐
                │  Claude Parse Engine         │
                │  prompt → STRICT JSON record │
                └──────────────┬──────────────┘
                               │ validated JSON
                               ▼
                ┌─────────────────────────────┐
                │  Supabase: transactions      │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  Confirm reply         Daily threshold cron     Monthly report cron
  (WhatsApp out)        (WhatsApp warning)        (xlsx + summary)
```

**The single most important component is the Claude Parse Engine.** Build and test it in isolation first, before wiring any channels.

---

## 5. Data Model (Supabase / Postgres)

Keep it minimal and generic. One core table handles expenses, income, savings, and investments uniformly.

### `users`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | Supabase auth id |
| whatsapp_number | text (unique) | E.164 format, used to route incoming messages |
| display_name | text | |
| daily_threshold | numeric | spend limit that triggers a warning |
| currency | text | default 'NGN' |
| created_at | timestamptz | |

### `transactions` (the core table)
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| user_id | uuid (fk) | |
| direction | text | `in` \| `out` |
| bucket | text | `expense` \| `income` \| `saving` \| `investment` |
| amount | numeric | always positive; `direction` carries the sign |
| currency | text | default 'NGN' |
| category | text | e.g. fuel, food, rent, salary, freelance |
| source | text | for income: where it came from; for expense: merchant/payee |
| remark | text | user note; editable |
| channel | text | `whatsapp_text` \| `whatsapp_voice` \| `alert` \| `statement` \| `manual` |
| occurred_at | timestamptz | when the money moved |
| raw_input | text | original message / alert / statement line (for re-parsing & audit) |
| confidence | numeric | Claude's parse confidence 0–1 (flag low ones for review) |
| needs_review | boolean | true if parse was ambiguous |
| created_at | timestamptz | |

> **Why one table:** savings and investments are just `bucket` values, not separate schemas. Adding a life-tracker "habit" or "workout" record later = a new bucket/record-type table that follows the same parse→validate→store pattern. No rewrite.

### `statements` (uploaded files audit)
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| user_id | uuid (fk) | |
| file_url | text | Supabase storage |
| period_start / period_end | date | |
| status | text | `processing` \| `done` \| `error` |
| created_at | timestamptz | |

Enable **Row Level Security** on all tables, keyed to `user_id`.

---

## 6. The Claude Parse Engine (core)

A single function `parseToRecord(rawText, context)` that sends `rawText` to Claude with a strict system prompt and returns validated JSON.

**System prompt requirements:**
- Return **only** JSON, no prose, no markdown fences.
- Schema: `{ direction, bucket, amount, currency, category, source, remark, occurred_at, confidence, needs_review }`.
- If amount is missing/ambiguous, set `needs_review: true` and `confidence` low.
- Normalize Nigerian shorthand: "5k" → 5000, "2.5m" → 2500000.
- Infer `bucket`: spending → expense; money received → income; "moved to savings" → saving; "bought stock/crypto" → investment.
- Default `occurred_at` to now if no date stated.
- Default currency NGN.

**Always validate the JSON server-side** (zod or manual) before insert. Never trust the model's output blindly — check `amount` is a positive number, `direction`/`bucket` are in the allowed enums. If validation fails, set `needs_review` and store `raw_input` so it can be re-parsed/edited.

**Example inputs it must handle:**
- `"spent 5k on fuel"` → out / expense / 5000 / fuel
- `"got 250k salary from ProbeTech"` → in / income / 250000 / source: ProbeTech
- `"moved 50k to savings"` → out direction but bucket: saving
- `"bought 100k of USDT"` → bucket: investment
- A pasted GTBank debit alert → extract amount, payee, balance, date

---

## 7. Bank Alert Parsing (v1 method)

Nigerian banks send debit/credit SMS + email alerts. Pipeline:
1. I forward alerts into the system (WhatsApp forward, or email-to-webhook).
2. Same `parseToRecord` engine extracts amount, direction, merchant/source, balance, date.
3. Store with `channel: 'alert'`.

Build a few bank-specific regex pre-extractors (GTBank, Access, Opay, Kuda, etc.) to feed Claude cleaner input and raise confidence, but Claude is the fallback parser for any format.

---

## 8. Statement Upload & Analysis

1. Upload PDF/CSV statement → Supabase storage → create `statements` row.
2. Extract text (PDF: pdf-parse / pdftotext; CSV: papaparse).
3. Chunk rows, send to Claude in batches → array of transaction JSON records.
4. **De-duplicate** against existing `transactions` (match on amount + date + source) so re-uploads don't double-count.
5. Insert, flag low-confidence rows as `needs_review`.

---

## 9. WhatsApp Integration

- WhatsApp **Cloud API** (Meta developer account + a verified number).
- Webhook endpoint verifies Meta's challenge token and validates the request signature.
- **Text message** → `parseToRecord` → store → reply with a confirmation ("✅ Recorded ₦5,000 — Fuel. Reply 'edit' to change.").
- **Voice note** → download media → Groq Whisper → text → same flow.
- **Outbound** (confirmations, threshold warnings, reports) via the Cloud API send-message endpoint.
- Route incoming messages to the right `user` by `whatsapp_number`.

> Real-time spoken conversation (like a phone call) is out of scope for WhatsApp. v1 = voice-note in, text/voice-note out. Feels Siri-like enough.

---

## 10. Daily Threshold Notification

- Render cron (e.g. hourly, or end-of-day per user timezone).
- Sum today's `out`/`expense` for each user; if `> daily_threshold`, send a WhatsApp warning with the running total and remaining-vs-typical context.
- Don't spam: send once when first crossed, then optionally a second nudge.

---

## 11. Monthly Report

- Cron on the 1st of each month for the prior month.
- Aggregate per user: total earned (income), spent (expense), saved (saving), invested (investment), plus top categories and biggest expenses.
- Have Claude write a short plain-language summary ("You earned ₦X, spent ₦Y (mostly food & transport), saved ₦Z…").
- Generate an `.xlsx` (transactions sheet + summary sheet) with SheetJS.
- Deliver: WhatsApp text summary + a link to download the spreadsheet.

---

## 12. Landing Page (low priority — build last)

Vite + React + Tailwind. Single page: what it is, how it works (3 steps: connect WhatsApp → talk to it → get reports), a waitlist/contact form. Reuse your existing portfolio aesthetic. Deploy to Vercel.

---

## 13. Build Order (do them in this sequence)

1. **Supabase**: create schema above, enable RLS, seed one test user (your WhatsApp number).
2. **Parse Engine**: `parseToRecord()` + zod validation. Test with a script feeding the example inputs in §6. **Get this rock-solid before anything else.**
3. **Manual API**: Express routes — create / read / update (esp. edit remark & category) / delete a transaction. This is your fallback UI and test surface.
4. **WhatsApp text**: webhook → parse → store → confirm reply.
5. **Voice notes**: media download → Groq Whisper → parse flow.
6. **Alert parsing**: bank regex pre-extractors + Claude fallback.
7. **Statement upload**: storage → extract → batch parse → dedupe → store.
8. **Daily threshold cron**.
9. **Monthly report cron** (xlsx + Claude summary).
10. **Landing page**.
11. *(Phase 2)* **Mono live bank linking**.

---

## 14. Environment Variables

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
DAILY_THRESHOLD_DEFAULT=
TZ=Africa/Lagos
```

---

## 15. Phase 2 & Beyond (do not build yet)

- **Mono / Okra** live bank linking (requires business onboarding, KYC, BAA-style approval — start the application early since it takes time).
- Web dashboard with charts (you already have the React/GSAP/Three skill set).
- **Life-tracker modules**: habits, health, tasks — each a new record type reusing the parse→validate→store pattern.
- Budgets per category, recurring transaction detection, savings goals.

---

## 16. Security & Compliance Notes

- Financial data is sensitive. Enable Supabase RLS, never expose the service key client-side, validate Meta webhook signatures.
- Store only what's needed; `raw_input` aids accuracy but consider redaction for the statement audit trail.
- If this ever serves other users, you're handling financial PII — revisit NDPR obligations (you've navigated this with MediConnect).

---

## 17. First Prompt to Give Claude Code

> "Set up the project: Node/Express (ESM) backend + Supabase. Create the schema in §5 with RLS. Then implement `parseToRecord()` from §6 using the Anthropic SDK with strict JSON output and zod validation. Write a test script that runs the example inputs in §6 and prints the parsed records. Do not build any channel integration yet — just the parse engine and the database."