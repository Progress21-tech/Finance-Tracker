# Quillio — Frontend Build Brief

> Build the full **Quillio** web app: a public landing page, auth, onboarding, and an authenticated chat-centric dashboard. Chat is the centerpiece. This document is the build spec for Claude Code. Replace the existing basic `frontend/` folder contents with this.

---

## 0. Brand & positioning

**Name:** Quillio
**Domain:** quillio.co
**Tagline direction:** "Turn messy spending into clarity." (or similar — see copy rules)

**The story the whole UI must tell:** Quillio is **not** "just an expense tracker." The pitch: *it takes your messy spending and turns it into a structured, exportable, analyzable format* — a full budgeting app with AI insights and suggestions. The user talks to it in natural language (or uploads statements/photos), and it organizes everything into clean records, charts, and monthly reports. Every piece of copy and visual should reinforce: **messy in → structured, insightful, exportable out.**

**Name meaning (use in brand voice where it fits):** a *quill* is the original instrument of record-keeping — ledgers, accounts, signatures. Quillio is the modern, AI version of that: it keeps your financial record for you. Lean into "your money, written clearly."

**This is a BETA.** No pricing tiers yet — the goal is to validate usage and value first. Build so tiering is easy to add later (the backend has a `plan` field defaulting to `'beta'`), but show no paywall, no price page (or a "free during beta" placeholder if a pricing section is wanted on the landing page). Add a subtle "Beta" tag near the logo in the app.

---

## 1. Tech & structure

- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router — landing `/`, auth `/login` `/signup`, onboarding `/onboarding`, app `/app/*`
- **Auth:** Supabase Auth — email/password **and** Google OAuth
- **Backend:** the EXISTING deployed API at `https://finance-tracker-fd5d.onrender.com` (transactions, dashboard, analytics, suggestions, reports, statements, profile). Do NOT rebuild backend logic — the frontend consumes existing routes. Add `VITE_API_BASE_URL`. Send the Supabase JWT as `Authorization: Bearer <token>` on every authenticated call.
- **State/data:** React Query (TanStack Query) for API calls; Supabase client for auth + session.
- **Charts:** Recharts (clean, readable — see §5).
- **3D:** React Three Fiber + drei for the hero/dashboard finance object (see §6).
- **Animation:** Framer Motion for UI transitions; GSAP optional for hero scroll choreography.
- **Theme:** light/dark mode toggle, persisted, applied across landing AND app. Build with CSS variables / Tailwind `dark:` from the start — not bolted on later.
- **Location:** replace contents of the existing `frontend/` folder. Deploy target: Vercel.

---

## 2. Visual identity

The aesthetic: **modern AI-product meets fintech** — green mesh-gradient atmosphere, glassmorphism, 3D, but with **clean readable data viz** (not flashy where data lives).

### Palette
- **Primary green** mesh gradient (replaces the purple in the Qubi inspiration). Range across: deep emerald `#0B3D2E`, mid `#10B981` / `#16A34A`, bright lime accent `#A3E635`, soft mint `#D1FAE5`.
- **Neutrals:** near-black `#0A0F0D` (dark bg), off-white `#F8FAF9` (light bg), glass surfaces using white/black at low opacity + backdrop-blur.
- **Semantic colors (consistent across charts + tags):** income/positive = green; expense/negative = warm coral `#F87171`; savings = teal; investment = amber.

### Mesh gradient
Hero and auth backgrounds use an animated **green mesh gradient** (the Qubi look, recolored purple→green). Layered radial gradients + slow subtle animation. Must work in both themes — airier/lighter in light mode, deep and glowing in dark.

### Glassmorphism
Cards, the chat box, and nav use frosted glass: semi-transparent bg, `backdrop-blur`, 1px subtle border (white at low opacity), soft inner glow. Use tastefully — data tables and charts stay clean and high-contrast for readability.

### Typography
- Display/headline: a characterful modern sans (e.g. **Clash Display**, **Satoshi**, or **General Sans**) for hero + section headers.
- Body/UI: clean neutral sans (**Inter** or **Geist**).
- Numbers/data: tabular figures (`tabular-nums`) so amounts align in tables and charts.

### Logo
Quillio wordmark + a simple mark that nods to a **quill / feather** abstracted into a clean modern symbol (could double as a checkmark, an upward stroke, or a nib). Keep it simple, works in mono for light/dark. Place a small "Beta" pill beside it in the app.

---

## 3. Landing page (public, pre-signup)

Single-page scroll, inspired by SphereAI + Qubi. Sections:

1. **Hero:** green mesh-gradient background. Big headline (positioning from §0). A **3D finance object** floating in the hero (§6), subtly animated. Below the headline, a **chat-box mockup** styled exactly like the real app's chat input (glass, rounded, upload icon, send button) — BUT typing/submitting triggers a **signup CTA/modal** instead of answering. Quick-suggestion pills above it ("Track an expense", "Analyze my statement", "Set a budget") that also route to signup.
2. **Value props** (Qubi "Our Goals" style): 3 glass cards — *Structured* (messy → clean records), *Insightful* (AI analysis + suggestions), *Exportable* (spreadsheets, reports). Small glass/3D icons.
3. **How it works:** 3 steps — talk to it (or upload) → it organizes → you get analytics & reports.
4. **Feature showcase:** the multimodal angle (chat, voice notes, statement/photo upload), analytics, AI budgeting suggestions. SmartPrompt-style split layout.
5. **Social proof / "Built for your money"** band (testimonial-style cards, placeholder copy).
6. **Final CTA** (SphereAI closing style): big mesh-gradient band, "Start organizing your money — free during beta" → signup.
7. **Footer:** links, theme toggle, "Quillio — Beta" note.

Motion: hero load sequence, scroll-triggered reveals, hover micro-interactions. Respect `prefers-reduced-motion`.

---

## 4. Auth + onboarding

- **`/signup` & `/login`:** Supabase Auth. Email/password + "Continue with Google". Glass card on mesh-gradient bg. Validation messages in Quillio's voice.
- **On first login:** call the backend auth/sync endpoint to create/fetch the backend user record (links Supabase `auth.uid` to the backend `user_id`).
- **`/onboarding`** (first login only): short, friendly multi-step flow so the AI personalizes from message one. One question per step, with skip:
  - Display name
  - Primary currency (default NGN)
  - Monthly income range (optional)
  - Top spending categories they care about (multi-select: food, transport, rent, data/airtime, etc.)
  - **Daily spending threshold** (drives the overspend warning)
  - Primary financial goal (save more / invest / cut spending / just track)
  Persist via the backend profile endpoint (`PATCH /me/profile`). After finishing, route to `/app`.

---

## 5. Authenticated app — `/app` (chat is the centerpiece)

### Layout (Link AI inspired)
- **Left icon rail** (slim, sleek, glass): nav icons with labels — Chat (default/home), Dashboard, Transactions, Analytics, Reports, Upload, Settings. Sleek arranged icons exactly like the Link AI reference. Collapsible. Active state highlighted. User avatar + theme toggle + "Beta" tag at the bottom/top.
- **Main area:** routed views. Chat is the landing view of `/app`.

### 5a. Chat view (the hero of the app)
- Centerpiece, Link AI "Ask AI Agent" style: greeting ("Hi [name] — how can I help with your money?"), the **3D finance object** above it (§6), and a large **ChatGPT-style input**:
  - Auto-growing textarea (grows with content, like ChatGPT).
  - **Isolated upload button** (paperclip) on the left INSIDE the input area — menu to attach **spreadsheets (csv/xlsx), images, photos** (e.g. a receipt photo or statement screenshot). Show attached-file chips above the input before sending.
  - Voice-note button (mic) — records audio, sends to backend transcription.
  - Send button (bottom-right, accent green).
- **Conversation thread:** user + assistant messages. When the assistant records a transaction, render a rich inline **transaction confirmation card** (amount, category, bucket, editable remark) — editable right from the card, not plain text.
- Suggestion chips on empty state ("Log an expense", "Analyze last month", "How much did I spend on food?").
- Chat input → existing parse/create endpoint. Uploads → existing `/statements` endpoint.

### 5b. Dashboard view
Inspired by Monetra/OripioFin — **clean green palette, readable charts**. Consumes `GET /dashboard`. Cards:
- Top metric cards: **Balance / Earned / Spent / Saved / Invested** for the period.
- **Cash-flow chart** (Recharts bar or area) — income vs expense over months, clear hover tooltip, Monthly/Yearly toggle. Readable, not cluttered — generous spacing, muted gridlines, one accent per series.
- Category breakdown (donut or horizontal bars).
- Recent transactions list (links to full table).

### 5c. Transactions view
Consumes `GET /transactions` (filter/sort/search/paginate) + `PATCH`/`DELETE`.
- Full table: date, direction, bucket, category, source, remark, amount. Sortable, filterable (bucket, category, date range, search).
- **Inline edit** (remark, category, amount) and delete.
- **Manual add** button → modal/drawer (routes through validation).
- `needs_review` rows visually highlighted.

### 5d. Analytics + AI suggestions
Consumes `GET /analytics` + `GET /suggestions`.
- Deeper charts: spending trends, category over time, savings rate.
- **AI suggestions panel:** actionable budgeting insights from the backend ("You spent 40% more on transport this month", "At this rate you'll hit your savings goal in 3 months"). This is a standout feature — make it prominent and clear.

### 5e. Reports
Consumes `GET /reports/monthly` + `GET /reports/export`.
- Monthly report: spent/saved/invested/earned summary + AI-written narrative.
- **Export**: download as spreadsheet (xlsx) / PDF. Key positioning feature — make export prominent and satisfying.

### 5f. Upload view (statements)
Consumes `POST /statements`.
- Drag-and-drop for bank statements (PDF/CSV/xlsx) and receipt photos.
- Processing status → parsed rows (deduped), low-confidence flagged for review before commit.

### 5g. Settings
- Profile, currency, daily threshold, categories, theme, connected channels (Telegram connected; WhatsApp when ready), plan (shows "Beta"), log out.

---

## 6. The 3D finance object

- A finance-themed 3D object (NOT Link AI's generic orb). Ideas: a slowly rotating glassy/iridescent **coin, stacked coins, a glowing green sphere with a subtle currency/grid motif, or an abstract "growth/quill-nib" shape**. Glassmorphic, green-tinted, soft iridescent edges.
- Built with React Three Fiber + drei. Lightweight — modest poly count + shaders (must run acceptably). Subtle float + rotation; gentle pointer reaction.
- Used in: landing hero, and the app chat view's empty state.
- Provide a static fallback image for reduced-motion / low-power devices.

---

## 7. Quality floor (non-negotiable)

- Fully responsive to mobile (icon rail → bottom bar or drawer; chat works on mobile).
- Light AND dark mode across every view, toggle persisted.
- Visible keyboard focus; `prefers-reduced-motion` respected (disable heavy 3D/mesh animation).
- Loading + empty + error states everywhere, in Quillio's voice (empty chat = invitation; errors explain what to do).
- Format currency properly (NGN default), round displayed numbers, `tabular-nums`.
- Don't block the whole UI on slow API calls (Render free tier cold-starts ~30–50s) — show skeletons/loaders.

---

## 8. Build order (checkpoints — stop and let me verify after each)

1. **Scaffold + theme:** Vite/React/TS + Tailwind + routing + light/dark theme system + design tokens (palette, fonts, Quillio brand) from §2. Verify tokens + theme toggle on a blank page.
2. **Landing page** (§3) with mesh gradient + glass, static (3D object can be a placeholder first). Verify look in both themes.
3. **3D finance object** (§6) in the hero. Verify performance.
4. **Auth + onboarding** (§4) wired to Supabase + backend sync/profile. Verify signup/login/Google + onboarding persists.
5. **App shell + left icon rail** (§5 layout). Verify nav + routing + theme inside the app.
6. **Chat view** (§5a) wired to the existing parse API, with upload + voice + inline transaction cards. Verify a typed expense records and shows a card.
7. **Dashboard** (§5b) with real data + charts.
8. **Transactions** (§5c) — table, inline edit, manual add.
9. **Analytics + AI suggestions** (§5d), **Reports + export** (§5e), **Upload** (§5f), **Settings** (§5g).
10. Polish pass: responsiveness, motion, empty/error states, accessibility, brand consistency.

After each checkpoint: stop, say what you built, how to run/verify it, and wait for "continue."

---

## 9. Rules throughout

- Consume the EXISTING backend; don't duplicate parse/store logic. If a route you need doesn't exist, flag it — don't invent it.
- Auth: send Supabase JWT on every authenticated request; handle expired-session gracefully.
- Keep secrets in env vars (`VITE_API_BASE_URL`, Supabase URL + anon key). Never commit them.
- The landing-page chat mockup and the real app chat input must look identical (the landing one just routes to signup).
- Spend boldness on hero + 3D + mesh; keep data views clean and readable. Charts are for comprehension, not decoration.
- Copy: Quillio's voice — warm, clear, plain verbs, sentence case, specific over clever. Reinforce "messy → clear, exportable, insightful."
- Beta: no paywall, no enforced limits; "free during beta" where pricing would otherwise appear.