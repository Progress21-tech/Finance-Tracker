import './config.js'; // loads dotenv
import express from 'express';
import { config } from './config.js';
import transactionsRouter from './routes/transactions.js';
import statementsRouter from './routes/statements.js';
import webhookRouter from './routes/webhook.js';
import { startThresholdCron } from './crons/threshold.js';
import { startMonthlyReportCron } from './crons/monthlyReport.js';

const app = express();

// Capture raw body for Meta webhook signature verification
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (allow all origins; tighten for production)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/transactions', transactionsRouter);
app.use('/statements', statementsRouter);
app.use('/webhook', webhookRouter);

// Start background cron jobs
startThresholdCron();
startMonthlyReportCron();

app.listen(config.PORT, () => {
  console.log(`✅ Finance Tracker backend running on port ${config.PORT}`);
});
