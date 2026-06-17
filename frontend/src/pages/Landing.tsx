import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Paperclip, Mic, Send, ArrowRight, Check,
  BarChart3, FileSpreadsheet, Sparkles, Upload,
  MessageSquare, ShieldCheck, Zap, ChevronRight,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

// ── Animation helpers ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } },
});

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={stagger(delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 glass border-b border-white/5 backdrop-blur-xl">
      <Logo size="sm" />
      <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-muted)]">
        <a href="#how" className="hover:text-[var(--text)] transition-colors">How it works</a>
        <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
        <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle size="sm" />
        <Link to="/login" className="hidden md:block text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5">
          Log in
        </Link>
        <Link
          to="/signup"
          className="text-sm font-medium px-4 py-2 rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white transition-all duration-150 shadow-green-sm"
        >
          Get started free
        </Link>
        <button className="md:hidden text-[var(--text-muted)]" onClick={() => setMenuOpen(!menuOpen)}>
          <ChevronRight size={20} className={`transition-transform ${menuOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden absolute top-full inset-x-0 glass border-b border-white/5 px-6 py-4 flex flex-col gap-4 text-sm">
          <a href="#how" onClick={() => setMenuOpen(false)} className="text-[var(--text-muted)]">How it works</a>
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-[var(--text-muted)]">Features</a>
          <Link to="/login" className="text-[var(--text-muted)]">Log in</Link>
        </div>
      )}
    </nav>
  );
}

// ── Chat Mockup ─────────────────────────────────────────────────────────────────
const PILLS = [
  'Track an expense',
  'Analyze my statement',
  'How much did I spend on food?',
  'Set a monthly budget',
];

function ChatMockup({ onInteract }: { onInteract: () => void }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onInteract();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Suggestion pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {PILLS.map(pill => (
          <button
            key={pill}
            onClick={onInteract}
            className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-[var(--text-muted)] hover:text-quillio-400 hover:border-quillio-500/30 transition-all duration-150"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative flex items-end gap-2 p-3 rounded-2xl transition-all duration-200
            glass border
            ${focused ? 'border-quillio-500/40 shadow-green-sm' : 'border-white/10'}
          `}
        >
          <button
            type="button"
            onClick={onInteract}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-quillio-400 hover:bg-white/5 transition-colors"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={onInteract}
            placeholder="Tell Quillio about a transaction, or ask anything about your money…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none leading-relaxed max-h-32 overflow-y-auto scrollbar-thin"
            style={{ minHeight: '24px' }}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onInteract}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-quillio-400 hover:bg-white/5 transition-colors"
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white transition-colors shadow-green-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── 3D Placeholder (replaced in checkpoint 3) ─────────────────────────────────
function FinanceObjectPlaceholder() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="w-32 h-32 mx-auto mb-8 relative"
    >
      <div className="absolute inset-0 rounded-full bg-quillio-500/20 blur-2xl animate-pulse" />
      <div className="relative w-full h-full rounded-full border border-quillio-500/30 glass flex items-center justify-center glow-green">
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
          <path d="M26 4C26 4 18 8 14 16C12 20 12 26 12 26L8 28C8 28 10 22 10 20C10 18 8 16 8 16C8 16 14 14 18 10C20 7 22 4 26 4Z" fill="url(#q1)" opacity="0.9"/>
          <path d="M12 26L6 30" stroke="url(#q1)" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="q1" x1="6" y1="30" x2="26" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#A3E635"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function HeroSection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-24 px-6 overflow-hidden mesh-bg">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-quillio-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-quillio-lime/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-quillio-500/20 text-quillio-400 text-xs font-medium mb-8"
        >
          <Sparkles size={12} />
          Free during beta — no credit card required
        </motion.div>

        {/* 3D Object */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <FinanceObjectPlaceholder />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-display font-black text-display-xl md:text-display-2xl leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-[var(--text)]">Turn messy</span>{' '}
          <span className="text-gradient">spending</span>
          <br />
          <span className="text-[var(--text)]">into clarity.</span>
        </motion.h1>

        <motion.p
          variants={stagger(0.15)}
          initial="hidden"
          animate="show"
          className="text-lg md:text-xl text-[var(--text-muted)] max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Talk to Quillio in plain language. Upload your bank statements.
          It organises everything into clean records, charts, and monthly reports — automatically.
        </motion.p>

        {/* Chat mockup */}
        <motion.div
          variants={stagger(0.25)}
          initial="hidden"
          animate="show"
        >
          <ChatMockup onInteract={onSignup} />
        </motion.div>

        {/* Trust signal */}
        <motion.p
          variants={stagger(0.35)}
          initial="hidden"
          animate="show"
          className="mt-6 text-xs text-[var(--text-subtle)] flex items-center justify-center gap-2"
        >
          <ShieldCheck size={12} className="text-quillio-500" />
          Works via WhatsApp, Telegram, or web — your data stays yours.
        </motion.p>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-quillio-500/40" />
        <div className="w-1 h-1 rounded-full bg-quillio-500/40" />
      </motion.div>
    </section>
  );
}

// ── Value props ────────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: <Check size={20} className="text-quillio-500" />,
    title: 'Structured',
    body: 'Every expense, income, and transfer — messy texts and statements go in, clean, categorised records come out.',
    color: 'quillio',
  },
  {
    icon: <Sparkles size={20} className="text-amber-400" />,
    title: 'Insightful',
    body: "AI reads your numbers and tells you what they mean. Spending trends, savings rate, and plain-English suggestions — not just charts.",
    color: 'amber',
  },
  {
    icon: <FileSpreadsheet size={20} className="text-teal-400" />,
    title: 'Exportable',
    body: 'Download your records as a spreadsheet or PDF report any time. Your data, fully portable, ready for your accountant or tax return.',
    color: 'teal',
  },
];

function ValuePropsSection() {
  return (
    <section className="py-24 px-6 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-quillio-500 mb-3">Why Quillio</p>
          <h2 className="font-display font-bold text-display-md text-[var(--text)]">
            Your money, written clearly.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.1}>
              <div className="group h-full p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-quillio-500/30 transition-all duration-300 hover:shadow-glass-sm">
                <div className="w-10 h-10 rounded-xl bg-[var(--elevated)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-[var(--text)] mb-2">{v.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{v.body}</p>
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
    icon: <MessageSquare size={22} className="text-quillio-400" />,
    title: 'Talk to it — or upload',
    body: 'Send a message ("spent ₦4,200 on groceries"), forward a bank alert, voice-note a purchase, or drop in a statement PDF. Any format.',
  },
  {
    num: '02',
    icon: <Zap size={22} className="text-quillio-lime" />,
    title: 'It organises automatically',
    body: "Quillio reads your input, classifies it (expense / income / savings / investment), picks the category, and stores a clean record in seconds.",
  },
  {
    num: '03',
    icon: <BarChart3 size={22} className="text-teal-400" />,
    title: 'Get analytics & reports',
    body: 'See where your money goes, get AI-written budgeting suggestions, and export a full report — monthly or any custom period you choose.',
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-quillio-500 mb-3">How it works</p>
          <h2 className="font-display font-bold text-display-md text-[var(--text)]">
            Three steps to financial clarity.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-quillio-500/30 to-transparent" />

          {STEPS.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.12} className="relative">
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-quillio-500/60">{step.num}</span>
                  <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--text)]">{step.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.body}</p>
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
    body: "Type it, say it, forward the bank alert, or upload the statement. Quillio handles plain text, voice notes, CSV, Excel, and PDF — without you reformatting anything.",
    icon: <Upload size={18} />,
    bullets: ['Natural language chat', 'Voice note transcription', 'Statement PDF / CSV upload', 'Bank alert forwarding (WhatsApp & Telegram)'],
    accent: 'quillio',
  },
  {
    tag: 'AI budgeting insights',
    title: 'Your numbers explained in plain English.',
    body: "Not just pie charts. Quillio reads your spending pattern and writes you specific, actionable suggestions — like a financial advisor who already knows your data.",
    icon: <Sparkles size={18} />,
    bullets: ['Monthly spending summary', 'Category trends & overspend alerts', 'Savings rate tracking', 'Plain-English AI suggestions'],
    accent: 'amber',
  },
  {
    tag: 'Export & reports',
    title: 'Your records, always portable.',
    body: "One click to download a polished spreadsheet or PDF report for any period. Share with your accountant, attach to a loan application, or just keep it for your records.",
    icon: <FileSpreadsheet size={18} />,
    bullets: ['XLSX spreadsheet export', 'PDF financial report', 'Custom date ranges', 'Monthly auto-report (coming soon)'],
    accent: 'teal',
  },
];

function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-24 px-6 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto space-y-20">
        <FadeIn className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-quillio-500 mb-3">Features</p>
          <h2 className="font-display font-bold text-display-md text-[var(--text)]">
            Built around how you actually spend.
          </h2>
        </FadeIn>

        {FEATURES.map((f, i) => (
          <FadeIn key={f.tag} delay={0.05}>
            <div className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
              {/* Text */}
              <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-quillio-500 mb-4">
                  {f.icon} {f.tag}
                </span>
                <h3 className="font-display font-bold text-display-sm text-[var(--text)] mb-4">{f.title}</h3>
                <p className="text-[var(--text-muted)] text-base leading-relaxed mb-6">{f.body}</p>
                <ul className="space-y-2">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                      <Check size={14} className="text-quillio-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className={`${i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''} mesh-bg rounded-2xl p-6 h-56 flex items-center justify-center`}>
                <div className="glass rounded-xl p-4 w-48 text-white/80 text-sm">
                  <p className="text-white/40 text-xs mb-1">{f.tag}</p>
                  <p className="font-display font-bold text-lg text-white">{f.title.split('.')[0]}</p>
                </div>
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
    <section className="py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-quillio-500 mb-3">Early users</p>
          <h2 className="font-display font-bold text-display-md text-[var(--text)]">
            Built for your money.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="h-full p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-4">
                <p className="text-[var(--text)] text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-quillio-500/20 text-quillio-400 text-xs font-bold flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-subtle)]">{t.role}</p>
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
    <section id="pricing" className="py-28 px-6 mesh-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-quillio-950/80 pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-widest text-quillio-400 mb-4">Free during beta</p>
          <h2 className="font-display font-black text-display-xl text-white mb-6">
            Start organising your money today.
          </h2>
          <p className="text-lg text-white/60 mb-10 leading-relaxed">
            No credit card. No pricing tiers. Just Quillio — your AI-powered financial record keeper.
          </p>
          <button
            onClick={onSignup}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-quillio-500 hover:bg-quillio-400 text-white font-semibold text-lg transition-all duration-150 glow-green"
          >
            Get started free
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-xs text-white/30">Takes 30 seconds to set up.</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" showBeta />
        <div className="flex items-center gap-6 text-xs text-[var(--text-subtle)]">
          <Link to="/login" className="hover:text-[var(--text-muted)] transition-colors">Log in</Link>
          <Link to="/signup" className="hover:text-[var(--text-muted)] transition-colors">Sign up</Link>
          <a href="mailto:hello@quillio.co" className="hover:text-[var(--text-muted)] transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-subtle)]">© {new Date().getFullYear()} Quillio</span>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </footer>
  );
}

// ── Landing (assembled) ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const handleSignup = () => navigate('/signup');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <HeroSection onSignup={handleSignup} />
      <ValuePropsSection />
      <HowItWorksSection />
      <FeatureShowcaseSection />
      <SocialProofSection />
      <FinalCTASection onSignup={handleSignup} />
      <Footer />
    </div>
  );
}
