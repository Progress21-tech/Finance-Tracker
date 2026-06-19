import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Paperclip, Mic, Send, ArrowRight, Check,
  BarChart3, FileSpreadsheet, Sparkles, Upload,
  MessageSquare, ShieldCheck, Zap, Monitor, Menu, X as XIcon,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

// ── Hero palette (always dark — never theme-swapped) ───────────────────────────
// Base: #051F18  Mid: #06302B  Accent: #10B981  Teal: #14B8A6  Lime: #A3E635

// ── Animation helpers ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
function stagger(delay = 0) {
  return {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } },
  };
}

function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={stagger(delay)} className={className}>
      {children}
    </motion.div>
  );
}

// ── Image slot: dark hero variant ─────────────────────────────────────────────
function HeroImageSlot({ label, aspect = '4/3', className = '' }: { label: string; aspect?: string; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ aspectRatio: aspect, background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(16,185,129,0.2)' }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none">
        <Monitor size={36} className="text-emerald-500/20" aria-hidden="true" />
        <p className="text-xs text-emerald-400/30 font-medium leading-relaxed">{label}</p>
        {/*
          Drop your real asset here:
          <img src="/assets/app-preview.png" alt="Quillio dashboard" className="absolute inset-0 w-full h-full object-cover" />
        */}
      </div>
    </div>
  );
}

// ── Image slot: light section variant ─────────────────────────────────────────
function LightImageSlot({ label, aspect = '4/3', className = '' }: { label: string; aspect?: string; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none">
        <Monitor size={36} className="text-gray-300" aria-hidden="true" />
        <p className="text-xs text-gray-400 font-medium leading-relaxed">{label}</p>
        {/*
          Drop your real asset here:
          <img src="..." alt="..." className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
        */}
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 border-b border-white/5"
      style={{ backgroundColor: 'rgba(5,31,24,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Logo size="sm" className="[--text:theme(colors.white)]" />

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(209,250,229,0.55)' }}>
          <a href="#how"      className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing"  className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden md:block text-sm px-3 py-1.5 transition-colors hover:text-white"
            style={{ color: 'rgba(209,250,229,0.55)' }}
          >
            Log in
          </Link>
          {/* Desktop CTA — hidden on mobile (lives in hero + hamburger) */}
          <Link
            to="/signup"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all duration-150"
            style={{ background: '#10B981', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
          >
            Get started free
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(209,250,229,0.7)' }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <XIcon size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/5"
            style={{ backgroundColor: '#051F18' }}
          >
            <div className="px-6 py-5 flex flex-col gap-5">
              <a href="#how"      onClick={() => setMenuOpen(false)} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(209,250,229,0.6)' }}>How it works</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(209,250,229,0.6)' }}>Features</a>
              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                <Link to="/login" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(209,250,229,0.6)' }}>
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-colors"
                  style={{ background: '#10B981' }}
                >
                  Get started free <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero chat input ────────────────────────────────────────────────────────────
const PILLS = [
  'Track an expense',
  'Analyze my statement',
  'How much did I spend on food?',
  'Set a monthly budget',
];

function HeroChat() {
  const navigate = useNavigate();
  const [value, setValue]       = useState('');
  const [focused, setFocused]   = useState(false);
  const [prompted, setPrompted] = useState(false);

  function savePending(msg: string) {
    if (msg.trim()) sessionStorage.setItem('quillio_pending_chat', msg.trim());
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    savePending(value);
    setPrompted(true);
  }

  function handlePillClick(pill: string) {
    savePending(pill);
    setPrompted(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  function goSignup() {
    if (value.trim()) savePending(value);
    navigate('/signup');
  }

  function goLogin() {
    if (value.trim()) savePending(value);
    navigate('/login');
  }

  if (prompted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
      >
        {value.trim() && (
          <div className="px-5 pt-5 pb-4 border-b border-white/5">
            <p className="text-xs font-medium mb-2" style={{ color: '#10B981' }}>Your message</p>
            <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(240,253,244,0.7)' }}>"{value.trim()}"</p>
          </div>
        )}
        <div className="px-5 py-5">
          <p className="font-semibold text-white mb-1">Create a free account to continue</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(209,250,229,0.45)' }}>No credit card. Free during beta.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goSignup}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-colors"
              style={{ background: '#10B981', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
            >
              Sign up free <ArrowRight size={15} />
            </button>
            <button
              onClick={goLogin}
              className="flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium transition-colors hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
            >
              Log in
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Suggestion pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PILLS.map(pill => (
          <button
            key={pill}
            onClick={() => handlePillClick(pill)}
            className="text-xs px-3 py-1.5 rounded-full transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(209,250,229,0.5)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#10B981';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(209,250,229,0.5)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="relative flex items-end gap-2 p-3 rounded-2xl transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${focused ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(16px)',
            boxShadow: focused ? '0 0 20px rgba(16,185,129,0.12)' : 'none',
          }}
        >
          <button type="button" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Paperclip size={16} />
          </button>

          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Quillio. about a transaction, or ask anything about your money…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '24px', color: 'rgba(255,255,255,0.9)', caretColor: '#10B981' }}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Mic size={16} />
            </button>
            <button
              type="submit"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white transition-colors"
              style={{ background: '#10B981', boxShadow: '0 0 14px rgba(16,185,129,0.35)' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      style={{
        backgroundColor: '#051F18',
        backgroundImage: `
          radial-gradient(ellipse at 15% 25%, rgba(20,184,166,0.16) 0%, transparent 52%),
          radial-gradient(ellipse at 85% 10%, rgba(16,185,129,0.13) 0%, transparent 48%),
          radial-gradient(ellipse at 55% 95%, rgba(6,48,43,0.85) 0%, transparent 45%)
        `,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full py-16 md:py-24 grid lg:grid-cols-2 gap-10 xl:gap-20 items-center">

        {/* LEFT: Text + chat */}
        <div>
          {/* Beta badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}
          >
            <Sparkles size={12} />
            Free during beta — no credit card required
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display font-black text-4xl sm:text-5xl xl:text-[3.5rem] leading-[1.05] tracking-tight mb-6 text-white"
          >
            Turn messy{' '}
            <span className="text-gradient-hero">spending</span>
            <br />
            into clarity.
          </motion.h1>

          <motion.p
            variants={stagger(0.12)}
            initial="hidden"
            animate="show"
            className="text-lg max-w-lg mb-8 leading-relaxed"
            style={{ color: 'rgba(209,250,229,0.58)' }}
          >
            Talk to Quillio. in plain language. Upload your bank statements.
            It organises everything into clean records, charts, and monthly reports — automatically.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate="show"
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-150"
              style={{ background: '#10B981', boxShadow: '0 0 24px rgba(16,185,129,0.35)' }}
            >
              Get started free <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-colors hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)' }}
            >
              Log in
            </Link>
          </motion.div>

          {/* Chat input */}
          <motion.div variants={stagger(0.28)} initial="hidden" animate="show">
            <HeroChat />
          </motion.div>

          {/* Trust signal */}
          <motion.p
            variants={stagger(0.38)}
            initial="hidden"
            animate="show"
            className="mt-5 text-xs flex items-center gap-2"
            style={{ color: 'rgba(209,250,229,0.32)' }}
          >
            <ShieldCheck size={12} style={{ color: 'rgba(16,185,129,0.6)' }} />
            Works via WhatsApp, Telegram, or web — your data stays yours.
          </motion.p>
        </div>

        {/* RIGHT: Product visual (desktop only) */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <HeroImageSlot
            label={"App preview — replace with a real screenshot or mockup\n(e.g. /assets/dashboard-preview.png)"}
            aspect="4/3"
          />

          {/* Floating stat card — top left */}
          <div
            className="absolute -top-4 -left-5 rounded-xl px-4 py-3 shadow-xl"
            style={{ background: 'rgba(6,48,43,0.92)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)' }}
          >
            <p className="text-xs mb-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>Saved this month</p>
            <p className="text-xl font-bold text-white font-display">₦124,500</p>
          </div>

          {/* Floating stat card — bottom right */}
          <div
            className="absolute -bottom-4 -right-5 rounded-xl px-4 py-3 shadow-xl"
            style={{ background: 'rgba(6,48,43,0.92)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)' }}
          >
            <p className="text-xs mb-0.5" style={{ color: 'rgba(20,184,166,0.8)' }}>Savings rate</p>
            <p className="text-xl font-bold text-white font-display">32%</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(52,211,153,0.55)' }}>↑ 4% vs last month</p>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute bottom-8 left-6 md:left-1/2 md:-translate-x-1/2 flex flex-col items-center gap-1"
      >
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.35))' }} />
        <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(16,185,129,0.35)' }} />
      </motion.div>
    </section>
  );
}

// ── Value props ────────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: <Check size={20} className="text-emerald-600" />,
    iconBg: 'bg-emerald-50',
    title: 'Structured',
    body: 'Every expense, income, and transfer — messy texts and statements go in, clean, categorised records come out.',
  },
  {
    icon: <Sparkles size={20} className="text-amber-500" />,
    iconBg: 'bg-amber-50',
    title: 'Insightful',
    body: "AI reads your numbers and tells you what they mean. Spending trends, savings rate, and plain-English suggestions — not just charts.",
  },
  {
    icon: <FileSpreadsheet size={20} className="text-teal-500" />,
    iconBg: 'bg-teal-50',
    title: 'Exportable',
    body: 'Download your records as a spreadsheet or PDF report any time. Your data, fully portable, ready for your accountant or tax return.',
  },
];

function ValuePropsSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Why Quillio.</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Your money, written clearly.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.1}>
              <div className="group h-full p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-[0_4px_24px_rgba(16,185,129,0.08)] transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: <MessageSquare size={22} className="text-emerald-600" />,
    title: 'Talk to it — or upload',
    body: 'Send a message ("spent ₦4,200 on groceries"), forward a bank alert, voice-note a purchase, or drop in a statement PDF. Any format.',
    imageLabel: 'Screenshot: WhatsApp / Telegram chat interface',
  },
  {
    num: '02',
    icon: <Zap size={22} className="text-amber-500" />,
    title: 'It organises automatically',
    body: "Quillio. reads your input, classifies it (expense / income / savings / investment), picks the category, and stores a clean record in seconds.",
    imageLabel: 'Screenshot: transaction being parsed and categorised',
  },
  {
    num: '03',
    icon: <BarChart3 size={22} className="text-teal-500" />,
    title: 'Get analytics & reports',
    body: 'See where your money goes, get AI-written budgeting suggestions, and export a full report — monthly or any custom period you choose.',
    imageLabel: 'Screenshot: dashboard charts and analytics',
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">How it works</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Three steps to financial clarity.
          </h2>
        </FadeIn>

        <div className="space-y-16">
          {STEPS.map((step, i) => (
            <FadeIn key={step.num} delay={0.05}>
              <div className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
                {/* Text */}
                <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-xs font-bold text-gray-300">{step.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.body}</p>
                </div>

                {/* Image slot */}
                <div className={i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                  <LightImageSlot label={step.imageLabel} aspect="16/10" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Feature showcase ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    tag: 'Multimodal input',
    title: 'Every way you spend money — tracked.',
    body: "Type it, say it, forward the bank alert, or upload the statement. Quillio. handles plain text, voice notes, CSV, Excel, and PDF — without you reformatting anything.",
    icon: <Upload size={16} />,
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    bullets: ['Natural language chat', 'Voice note transcription', 'Statement PDF / CSV upload', 'Bank alert forwarding (WhatsApp & Telegram)'],
    imageLabel: 'Screenshot: multimodal input interface — chat, voice, upload',
  },
  {
    tag: 'AI budgeting insights',
    title: 'Your numbers explained in plain English.',
    body: "Not just pie charts. Quillio. reads your spending pattern and writes you specific, actionable suggestions — like a financial advisor who already knows your data.",
    icon: <Sparkles size={16} />,
    accent: 'text-amber-600',
    accentBg: 'bg-amber-50',
    bullets: ['Monthly spending summary', 'Category trends & overspend alerts', 'Savings rate tracking', 'Plain-English AI suggestions'],
    imageLabel: 'Screenshot: AI suggestions and spending analytics panel',
  },
  {
    tag: 'Export & reports',
    title: 'Your records, always portable.',
    body: "One click to download a polished spreadsheet or PDF report for any period. Share with your accountant, attach to a loan application, or just keep it for your records.",
    icon: <FileSpreadsheet size={16} />,
    accent: 'text-teal-600',
    accentBg: 'bg-teal-50',
    bullets: ['XLSX spreadsheet export', 'PDF financial report', 'Custom date ranges', 'Monthly auto-report (coming soon)'],
    imageLabel: 'Screenshot: export modal and generated report preview',
  },
];

function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto space-y-24">
        <FadeIn className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Features</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Built around how you actually spend.
          </h2>
        </FadeIn>

        {FEATURES.map((f, i) => (
          <FadeIn key={f.tag} delay={0.05}>
            <div className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
              {/* Text */}
              <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${f.accent} mb-4`}>
                  <span className={`w-6 h-6 rounded-lg ${f.accentBg} flex items-center justify-center`}>{f.icon}</span>
                  {f.tag}
                </span>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed mb-6">{f.body}</p>
                <ul className="space-y-2.5">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image slot */}
              <div className={i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                <LightImageSlot label={f.imageLabel} aspect="4/3" />
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Social proof ───────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I just forwarded my bank alerts to Quillio and it sorted everything into categories by itself. My accountant was impressed.",
    name: 'Temi A.',
    role: 'Freelance designer, Lagos',
    initials: 'TA',
  },
  {
    quote: "Finally an expense tracker I actually use. I just chat with it the same way I'd text someone. It figures out the rest.",
    name: 'Kemi O.',
    role: 'Product manager',
    initials: 'KO',
  },
  {
    quote: "Uploaded 3 months of statements and had a full breakdown in minutes. The export to Excel alone saves me hours every quarter.",
    name: 'Chidi M.',
    role: 'Small business owner',
    initials: 'CM',
  },
];

function SocialProofSection() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Early users</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Built for your money.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="h-full p-6 rounded-2xl border border-gray-100 bg-white flex flex-col gap-4 hover:border-emerald-100 hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
                <p className="text-gray-700 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────────
function FinalCTASection({ onSignup }: { onSignup: () => void }) {
  return (
    <section
      id="pricing"
      className="py-28 px-6 relative overflow-hidden"
      style={{
        backgroundColor: '#051F18',
        backgroundImage: `
          radial-gradient(ellipse at 30% 40%, rgba(20,184,166,0.14) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 60%, rgba(16,185,129,0.1) 0%, transparent 50%)
        `,
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#34D399' }}>
            Free during beta
          </p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-6 leading-tight">
            Start organising your<br />money today.
          </h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'rgba(209,250,229,0.5)' }}>
            No credit card. No pricing tiers. Just Quillio. — your AI-powered financial record keeper.
          </p>
          <button
            onClick={onSignup}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-150"
            style={{ background: '#10B981', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
          >
            Get started free
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Takes 30 seconds to set up.</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" />
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link to="/login"  className="hover:text-gray-600 transition-colors">Log in</Link>
          <Link to="/signup" className="hover:text-gray-600 transition-colors">Sign up</Link>
          <a href="mailto:hello@quillio.co" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Quillio.</span>
      </div>
    </footer>
  );
}

// ── Landing (assembled) ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />
      <HeroSection />
      <ValuePropsSection />
      <HowItWorksSection />
      <FeatureShowcaseSection />
      <SocialProofSection />
      <FinalCTASection onSignup={() => navigate('/signup')} />
      <Footer />
    </div>
  );
}
