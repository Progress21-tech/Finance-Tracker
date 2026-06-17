import { getToken } from './supabase';

const BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE) {
  console.error('[Quillio] Missing VITE_API_BASE_URL');
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // File download — caller handles blob separately
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('octet-stream') || ct.includes('spreadsheet') || ct.includes('pdf')) {
    return res.blob() as T;
  }

  return res.json();
}

// ── Auth / profile ────────────────────────────────────────────────────────────

export const api = {
  me: {
    sync:    ()                => request<User>('/me/sync', { method: 'POST' }),
    get:     ()                => request<User>('/me'),
    profile: (body: Partial<User> & Record<string, unknown>) =>
      request<User>('/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // ── Transactions ────────────────────────────────────────────────────────────
  transactions: {
    list: (params?: TxListParams) =>
      request<TxListResponse>(`/transactions?${new URLSearchParams(params as Record<string, string>)}`),
    get:    (id: string)           => request<Tx>(`/transactions/${id}`),
    create: (body: Partial<Tx> & { raw_text?: string }) =>
      request<Tx>('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Tx>) =>
      request<Tx>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    get: (period?: string, from?: string, to?: string) => {
      const p = new URLSearchParams({ period: period ?? 'this_month', ...(from && { from }), ...(to && { to }) });
      return request<DashboardData>(`/dashboard?${p}`);
    },
  },

  // ── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    get:         (period?: string) => request<AnalyticsData>(`/analytics?period=${period ?? 'this_month'}`),
    suggestions: ()                => request<{ suggestions: Suggestion[]; generatedAt: string }>('/analytics/suggestions'),
  },

  // ── Reports ─────────────────────────────────────────────────────────────────
  reports: {
    monthly: (month: string)                         => request<MonthlyReport>(`/reports/monthly?month=${month}`),
    export:  (format: 'xlsx' | 'pdf', period: string) => request<Blob>(`/reports/export?format=${format}&period=${period}`),
  },

  // ── Statements ──────────────────────────────────────────────────────────────
  statements: {
    list:    ()                 => request<Statement[]>('/statements'),
    preview: (file: File)       => {
      const fd = new FormData();
      fd.append('file', file);
      return request<PreviewResult>('/statements/preview', { method: 'POST', body: fd });
    },
    commit: (rows: PreviewRow[]) =>
      request<{ inserted: number }>('/statements/commit', { method: 'POST', body: JSON.stringify({ rows }) }),
    upload: (file: File)        => {
      const fd = new FormData();
      fd.append('file', file);
      return request<{ id: string; status: string }>('/statements/upload', { method: 'POST', body: fd });
    },
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  display_name: string | null;
  whatsapp_number: string | null;
  telegram_chat_id: string | null;
  daily_threshold: number;
  currency: string;
  plan: string;
  preferences: {
    monthly_income_range?: string;
    top_categories?: string[];
    primary_goal?: string;
    onboarding_complete?: boolean;
  };
  created_at: string;
}

export interface Tx {
  id: string;
  user_id: string;
  direction: 'in' | 'out';
  bucket: 'income' | 'expense' | 'saving' | 'investment';
  amount: number;
  currency: string;
  category: string;
  source: string;
  remark: string;
  channel: string;
  occurred_at: string;
  raw_input: string | null;
  confidence: number;
  needs_review: boolean;
  created_at: string;
}

export interface TxListParams {
  bucket?: string;
  direction?: string;
  category?: string;
  from?: string;
  to?: string;
  needs_review?: string;
  search?: string;
  sort?: string;
  limit?: string;
  offset?: string;
}

export interface TxListResponse {
  data: Tx[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardData {
  period: { from: string; to: string };
  totals: { income: number; expense: number; saving: number; investment: number };
  balance: number;
  net: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; pct: number }[];
  cashFlowSeries: { month: string; income: number; expense: number; saving: number; investment: number; net: number }[];
  recentTransactions: Tx[];
  needsReviewCount: number;
  txCount: number;
}

export interface AnalyticsData {
  period: { from: string; to: string };
  monthlyTimeline: {
    month: string;
    income: number;
    expense: number;
    saving: number;
    investment: number;
    net: number;
    savingsRate: number;
  }[];
  topCategories: { category: string; amount: number }[];
  categoryOverTime: Record<string, Record<string, number>>;
  spendingTrend: number | null;
}

export interface Suggestion {
  title: string;
  body: string;
}

export interface MonthlyReport {
  month: string;
  label: string;
  period: { from: string; to: string };
  totals: { income: number; expense: number; saving: number; investment: number };
  net: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
  txCount: number;
}

export interface Statement {
  id: string;
  user_id: string;
  file_url: string;
  status: 'processing' | 'done' | 'error';
  tx_count: number | null;
  error_msg: string | null;
  created_at: string;
}

export interface PreviewRow {
  direction: string;
  bucket: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  remark: string;
  occurred_at: string;
  confidence: number;
  needs_review: boolean;
}

export interface PreviewResult {
  rows: PreviewRow[];
  duplicateCount: number;
  totalParsed: number;
  newCount: number;
}
