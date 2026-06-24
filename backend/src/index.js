import './config.js'; // loads dotenv
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import transactionsRouter from './routes/transactions.js';
import statementsRouter  from './routes/statements.js';
import webhookRouter     from './routes/webhook.js';
import telegramRouter    from './routes/telegram.js';
import meRouter          from './routes/me.js';
import dashboardRouter   from './routes/dashboard.js';
import analyticsRouter   from './routes/analytics.js';
import reportsRouter     from './routes/reports.js';
import chatRouter        from './routes/chat.js';
import { startThresholdCron }    from './crons/threshold.js';
import { startMonthlyReportCron } from './crons/monthlyReport.js';

const app = express();

// CORS — allow configured frontend origin + Vercel previews + local dev
const staticAllowed = [
  config.FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // vite preview
].filter(Boolean).map(o => o.replace(/\/$/, '').toLowerCase());

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server / curl / mobile
  const normalized = origin.replace(/\/$/, '').toLowerCase();
  if (staticAllowed.includes(normalized)) return true;
  // any vercel.app subdomain (preview deploys)
  if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(normalized)) return true;
  return false;
}

// Handle preflight before any other middleware (including auth)
app.options('*', cors({
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin) ? origin || '*' : false),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    // return a 403-shaped response rather than throwing (avoids 500)
    cb(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parse JSON + capture raw body for Meta webhook HMAC verification
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); },
}));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Public routes (bots)
app.use('/webhook',      webhookRouter);
app.use('/telegram',     telegramRouter);

// Authenticated API routes
app.use('/me',           meRouter);
app.use('/transactions', transactionsRouter);
app.use('/statements',   statementsRouter);
app.use('/dashboard',    dashboardRouter);
app.use('/analytics',    analyticsRouter);
app.use('/reports',      reportsRouter);
app.use('/chat',         chatRouter);

// Start background cron jobs
startThresholdCron();
startMonthlyReportCron();

app.listen(config.PORT, () => {
  console.log(`Finance Tracker backend running on port ${config.PORT}`);
});
