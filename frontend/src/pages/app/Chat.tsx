import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip, Mic, Send, X, Edit2, Check,
  TrendingDown, TrendingUp, PiggyBank, BarChart2,
  MicOff, Loader2,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api, Tx } from '../../lib/api';
import { fmtCurrency, fmtDate, cap } from '../../lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface TextMsg  { id: string; role: Role; type: 'text'; content: string; }
interface TxMsg    { id: string; role: Role; type: 'tx';   tx: Tx; }
interface ErrMsg   { id: string; role: Role; type: 'error'; content: string; }
interface FileMsg  { id: string; role: Role; type: 'file'; fileName: string; status: 'uploading' | 'done' | 'error'; txCount?: number; }
type Message = TextMsg | TxMsg | ErrMsg | FileMsg;

const uid = () => Math.random().toString(36).slice(2);

const SUGGESTIONS = [
  'Log an expense',
  'How much did I spend this month?',
  'Analyze last month',
  'What are my top spending categories?',
];

// ── Bucket visuals ────────────────────────────────────────────────────────────

const BUCKET_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  income:     { icon: <TrendingUp  size={14} />, color: 'text-income',     bg: 'bg-income/10 border-income/20' },
  expense:    { icon: <TrendingDown size={14} />, color: 'text-expense',    bg: 'bg-expense/10 border-expense/20' },
  saving:     { icon: <PiggyBank   size={14} />, color: 'text-saving',     bg: 'bg-saving/10 border-saving/20' },
  investment: { icon: <BarChart2   size={14} />, color: 'text-investment',  bg: 'bg-investment/10 border-investment/20' },
};

// ── 3D placeholder (replaced in cp3) ─────────────────────────────────────────

function FinanceMark() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-20 h-20 mx-auto mb-6 relative"
    >
      <div className="absolute inset-0 rounded-full bg-quillio-500/15 blur-xl" />
      <div className="relative w-full h-full rounded-full border border-quillio-500/25 glass flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <path d="M26 4C26 4 18 8 14 16C12 20 12 26 12 26L8 28C8 28 10 22 10 20C10 18 8 16 8 16C8 16 14 14 18 10C20 7 22 4 26 4Z" fill="url(#cg)" opacity="0.9"/>
          <path d="M12 26L6 30" stroke="url(#cg)" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="cg" x1="6" y1="30" x2="26" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981"/><stop offset="100%" stopColor="#A3E635"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

// ── Transaction card ──────────────────────────────────────────────────────────

function TxCard({ tx: initial, currency }: { tx: Tx; currency: string }) {
  const [tx, setTx]           = useState(initial);
  const [editRemark, setER]   = useState(false);
  const [editCat, setEC]      = useState(false);
  const [remark, setRemark]   = useState(tx.remark);
  const [category, setCat]    = useState(tx.category);
  const [saving, setSaving]   = useState(false);

  const meta = BUCKET_META[tx.bucket] ?? BUCKET_META.expense;

  async function saveField(field: 'remark' | 'category', value: string) {
    setSaving(true);
    try {
      const updated = await api.transactions.update(tx.id, { [field]: value });
      setTx(updated);
    } catch { /* show stale data silently */ }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 max-w-sm w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
          {meta.icon} {cap(tx.bucket)}
        </span>
        <span className="text-xs text-[var(--text-subtle)]">{fmtDate(tx.occurred_at)}</span>
      </div>

      {/* Amount */}
      <p className={`font-display font-bold text-2xl tabular mb-1 ${meta.color}`}>
        {tx.direction === 'out' ? '−' : '+'}{fmtCurrency(tx.amount, currency)}
      </p>

      {/* Category */}
      <div className="flex items-center gap-1.5 mb-2">
        {editCat ? (
          <input
            autoFocus
            value={category}
            onChange={e => setCat(e.target.value)}
            onBlur={() => { setEC(false); saveField('category', category); }}
            onKeyDown={e => { if (e.key === 'Enter') { setEC(false); saveField('category', category); } }}
            className="text-xs bg-[var(--elevated)] border border-quillio-500/40 rounded-lg px-2 py-1 outline-none text-[var(--text)] w-32"
          />
        ) : (
          <button onClick={() => setEC(true)} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] group">
            <span>{cap(category) || 'Uncategorised'}</span>
            <Edit2 size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}
      </div>

      {/* Remark */}
      <div className="flex items-start gap-1.5">
        {editRemark ? (
          <div className="flex-1 flex gap-2">
            <input
              autoFocus
              value={remark}
              onChange={e => setRemark(e.target.value)}
              onBlur={() => { setER(false); saveField('remark', remark); }}
              onKeyDown={e => { if (e.key === 'Enter') { setER(false); saveField('remark', remark); } }}
              className="flex-1 text-xs bg-[var(--elevated)] border border-quillio-500/40 rounded-lg px-2 py-1 outline-none text-[var(--text)]"
            />
            {saving && <Loader2 size={12} className="animate-spin text-quillio-500 mt-1 shrink-0" />}
          </div>
        ) : (
          <button
            onClick={() => setER(true)}
            className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] text-left group flex items-start gap-1"
          >
            <span className="italic">{remark || 'Add a note…'}</span>
            <Edit2 size={10} className="opacity-0 group-hover:opacity-60 transition-opacity mt-0.5 shrink-0" />
          </button>
        )}
      </div>

      {tx.needs_review && (
        <p className="mt-2 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-0.5 inline-block">
          Low confidence — please verify
        </p>
      )}
    </div>
  );
}

// ── File chip ─────────────────────────────────────────────────────────────────

function FileChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
      <span className="font-mono text-quillio-400 text-[10px] uppercase">{ext}</span>
      <span className="max-w-[120px] truncate">{name}</span>
      <button onClick={onRemove} className="text-[var(--text-subtle)] hover:text-[var(--text)] ml-0.5">
        <X size={11} />
      </button>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg, currency }: { msg: Message; currency: string }) {
  const isUser = msg.role === 'user';

  if (msg.type === 'tx') {
    return (
      <div className="flex justify-start">
        <div>
          <p className="text-xs text-[var(--text-subtle)] mb-1.5 ml-1">Transaction recorded ✓</p>
          <TxCard tx={msg.tx} currency={currency} />
        </div>
      </div>
    );
  }

  if (msg.type === 'file') {
    return (
      <div className="flex justify-start">
        <div className="text-sm text-[var(--text-muted)] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          {msg.status === 'uploading' && <Loader2 size={14} className="animate-spin text-quillio-500" />}
          {msg.status === 'done' && <Check size={14} className="text-quillio-500" />}
          {msg.status === 'error' && <X size={14} className="text-red-400" />}
          <span>
            {msg.status === 'uploading' && `Parsing ${msg.fileName}…`}
            {msg.status === 'done' && `Found ${msg.txCount} transactions in ${msg.fileName}`}
            {msg.status === 'error' && `Failed to parse ${msg.fileName}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-quillio-500 text-white rounded-br-sm'
            : msg.type === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-bl-sm'
            : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Main Chat view ────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [files, setFiles]       = useState<File[]>([]);
  const [loading, setLoading]   = useState(false);
  const [recording, setRecording] = useState(false);

  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const bottomRef     = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const currency      = user?.currency ?? 'NGN';

  // Auto-grow textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function addMsg(msg: Message) { setMessages(prev => [...prev, msg]); }

  // ── File attach ──────────────────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  }

  // ── Voice recording ──────────────────────────────────────────────────────────
  async function toggleRecord() {
    if (recording) {
      mediaRecRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setFiles(prev => [...prev, file]);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
    } catch {
      addMsg({ id: uid(), role: 'assistant', type: 'error', content: 'Microphone access denied.' });
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function send() {
    const text  = input.trim();
    const hasFiles = files.length > 0;
    if (!text && !hasFiles) return;
    setLoading(true);

    // Show user message
    if (text) addMsg({ id: uid(), role: 'user', type: 'text', content: text });
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Upload files
    for (const file of files) {
      const msgId = uid();
      addMsg({ id: msgId, role: 'assistant', type: 'file', fileName: file.name, status: 'uploading' });
      try {
        const result = await api.statements.preview(file);
        // Auto-commit if confidence looks good
        if (result.rows.length > 0) {
          await api.statements.commit(result.rows);
          setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, status: 'done', txCount: result.rows.length } as FileMsg : m
          ));
        } else {
          setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, status: 'done', txCount: 0 } as FileMsg : m
          ));
        }
      } catch {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, status: 'error' } as FileMsg : m
        ));
      }
    }
    setFiles([]);

    // Parse text as transaction
    if (text) {
      try {
        const tx = await api.transactions.create({ raw_text: text });
        addMsg({ id: uid(), role: 'assistant', type: 'tx', tx });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not parse that. Try rephrasing, e.g. "Spent ₦2,500 on lunch".';
        addMsg({ id: uid(), role: 'assistant', type: 'error', content: msg });
      }
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4">
      {/* Thread */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-6 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full pb-8 text-center">
            <FinanceMark />
            <h2 className="font-display font-bold text-2xl text-[var(--text)] mb-2">
              Hi {user?.display_name ?? 'there'} —
            </h2>
            <p className="text-[var(--text-muted)] mb-8">
              How can I help with your money today?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-sm px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-quillio-400 hover:border-quillio-500/30 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Bubble msg={msg} currency={currency} />
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-quillio-500/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="pb-4 md:pb-6">
        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <FileChip key={i} name={f.name} onRemove={() => setFiles(prev => prev.filter((_, j) => j !== i))} />
            ))}
          </div>
        )}

        <div className={`
          flex items-end gap-2 p-3 rounded-2xl border transition-all duration-200
          bg-[var(--card)] border-[var(--border)]
          focus-within:border-quillio-500/40 focus-within:shadow-green-sm
        `}>
          {/* File button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-quillio-400 hover:bg-white/5 transition-colors"
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Quillio about a transaction, or ask anything about your money…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none leading-relaxed overflow-hidden disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '160px' }}
          />

          {/* Voice + send */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleRecord}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
                recording
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-[var(--text-muted)] hover:text-quillio-400 hover:bg-white/5'
              }`}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={loading || (!input.trim() && files.length === 0)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-quillio-500 hover:bg-quillio-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-green-sm"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--text-subtle)] mt-2">
          Shift+Enter for new line · attach CSV, PDF, or Excel statements
        </p>
      </div>
    </div>
  );
}
