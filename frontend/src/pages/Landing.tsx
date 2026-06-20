import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Paperclip, Mic, Send, ArrowRight, Check,
  BarChart3, FileSpreadsheet, Sparkles, Upload,
  MessageSquare, ShieldCheck, Zap, ChevronRight,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

// ── Animation helpers ──────────────────────────────────────────────────────────
const wordReveal = {
  hidden: { opacity: 0, y: 36, skewY: 2 },
  show: (i: number) => ({
    opacity: 1, y: 0, skewY: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function stagger(delay = 0) {
  return {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const } },
  };
}

function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
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

// ── Grain texture ─────────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] mix-blend-overlay">
      <filter id="hero-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#hero-grain)" />
    </svg>
  );
}

// ── Floating particles ────────────────────────────────────────────────────────
const PARTICLES = [
  { cx: '8%',  cy: '22%', r: 1.8, delay: 0,   dur: 7  },
  { cx: '82%', cy: '14%', r: 1.4, delay: 1.2, dur: 9  },
  { cx: '68%', cy: '72%', r: 2.2, delay: 2.1, dur: 8  },
  { cx: '22%', cy: '80%', r: 1.4, delay: 3,   dur: 6  },
  { cx: '54%', cy: '9%',  r: 1,   delay: 1.6, dur: 11 },
  { cx: '38%', cy: '92%', r: 1.8, delay: 0.4, dur: 8  },
  { cx: '91%', cy: '52%', r: 1.4, delay: 2.6, dur: 7  },
];

function HeroParticles() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {PARTICLES.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="#10B981"
          fillOpacity={0.35}
          animate={{ opacity: [0, 0.35, 0], y: [0, -18, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}

// ── 3D Finance Object ─────────────────────────────────────────────────────────
function FinanceObjectPlaceholder() {
  return (
    <div className="w-36 h-36 mx-auto mb-8 relative" aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-quillio-500/15 blur-3xl scale-[1.7] animate-pulse" />

      {/* Outer dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 144 144" className="w-full h-full">
          <circle cx="72" cy="72" r="68" fill="none" stroke="#10B981" strokeWidth="0.8" strokeOpacity="0.22" strokeDasharray="6 10" />
        </svg>
      </motion.div>

      {/* Inner dashed ring — counter-rotate */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-6"
      >
        <svg viewBox="0 0 96 96" className="w-full h-full">
          <circle cx="48" cy="48" r="45" fill="none" stroke="#A3E635" strokeWidth="0.6" strokeOpacity="0.15" strokeDasharray="3 6" />
        </svg>
      </motion.div>

      {/* Quill orb — float + gentle sway */}
      <motion.div
        animate={{ y: [0, -12, 0], rotateZ: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-10"
      >
        <motion.div
          animate={{ rotateY: [-15, 15, -15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(52,211,153,0.35) 0%, rgba(11,61,46,0.85) 70%)',
            border: '1px solid rgba(52,211,153,0.25)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.22), 0 0 60px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <path d="M26 4C26 4 18 8 14 16C12 20 12 26 12 26L8 28C8 28 10 22 10 20C10 18 8 16 8 16C8 16 14 14 18 10C20 7 22 4 26 4Z" fill="url(#obj-g1)" opacity="0.95"/>
            <path d="M12 26L6 30" stroke="url(#obj-g1)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M26 4L12 26" stroke="url(#obj-g2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
            <defs>
              <linearGradient id="obj-g1" x1="6" y1="30" x2="26" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#A3E635"/>
              </linearGradient>
              <linearGradient id="obj-g2" x1="12" y1="26" x2="26" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#6EE7B7"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>

      {/* Orbiting sparkle dots */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-quillio-400"
          style={{ top: '50%', left: '50%', marginTop: '-3px', marginLeft: '-3px' }}
          animate={{
            x: [0, Math.cos((i * 120 + 90) * Math.PI / 180) * 52],
            y: [0, Math.sin((i * 120 + 90) * Math.PI / 180) * 52, 0],
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1 + 0.4, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 glass border-b border-[var(--border)] backdrop-blur-xl">
      <Logo size="sm" />

      <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-muted)]">
        <a href="#how"      className="hover:text-[var(--text)] transition-colors duration-150">How it works</a>
        <a href="#features" className="hover:text-[var(--text)] transition-colors duration-150">Features</a>
        <a href="#pricing"  className="hover:text-[var(--text)] transition-colors duration-150">Pricing</a>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="hidden md:block text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-quillio-500 hover:bg-quillio-400 active:scale-95 text-white transition-all duration-150 shadow-[0_0_18px_rgba(16,185,129,0.28)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)]"
        >
          Get started free
        </Link>
        <button
          className="md:hidden text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <ChevronRight size={20} className={`transition-transform duration-200 ${menuOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full inset-x-0 bg-[var(--bg)] border-b border-[var(--border)] overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4 text-sm">
              <a href="#how"      onClick={() => setMenuOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">How it works</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Features</a>
              <Link to="/login"   onClick={() => setMenuOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Log in</Link>
              <Link
                to="/signup"
                className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-quillio-500 text-white text-center"
              >
                Get started free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Chat Mockup ───────────────────────────────────────────────────────────────
const PILLS = [
  'Track an expense',
  'Analyze my statement',
  'How much did I spend on food?',
  'Set a monthly budget',
];

function ChatMockup({ onInteract }: { onInteract: () => void }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); onInteract(); };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {PILLS.map(pill => (
          <motion.button
            key={pill}
            onClick={onInteract}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="text-xs px-3 py-2 min-h-[36px] rounded-full glass border border-[var(--border)] text-[var(--text-muted)] hover:dark:text-quillio-400 hover:text-quillio-600 hover:border-quillio-500/30 transition-colors duration-150"
          >
            {pill}
          </motion.button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          animate={focused
            ? { boxShadow: '0 0 0 1px rgba(16,185,129,0.4), 0 0 20px rgba(16,185,129,0.1)' }
            : { boxShadow: '0 0 0 0px transparent' }
          }
          className={`
            relative flex items-end gap-2 p-3 rounded-2xl transition-colors duration-200
            glass border
            ${focused ? 'border-quillio-500/40' : 'border-[var(--border)]'}
          `}
        >
          <button
            type="button"
            onClick={onInteract}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-quillio-500 hover:bg-quillio-500/5 transition-all duration-150"
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
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-quillio-500 hover:bg-quillio-500/5 transition-all duration-150"
            >
              <Mic size={16} />
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white transition-colors shadow-[0_0_14px_rgba(16,185,129,0.35)]"
            >
              <Send size={14} />
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-24 px-6 overflow-hidden mesh-bg">
      <GrainOverlay />
      <HeroParticles />

      {/* Drifting ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 -left-40 w-[28rem] h-[28rem] rounded-full bg-quillio-500/8 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        className="absolute bottom-1/4 -right-40 w-[28rem] h-[28rem] rounded-full bg-quillio-lime/8 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 text-center max-w-3xl mx-auto w-full">
        {/* Beta badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-quillio-500/20 dark:text-quillio-400 text-quillio-700 text-xs font-medium mb-8"
        >
          <Sparkles size={12} />
          Free during beta — no credit card required
        </motion.div>

        {/* 3D object */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <FinanceObjectPlaceholder />
        </motion.div>

        {/* Headline — word-by-word reveal */}
        <div className="font-display font-black text-4xl sm:text-5xl xl:text-[3.4rem] leading-[1.05] tracking-tight mb-6 overflow-hidden">
          <div className="flex flex-wrap justify-center gap-x-[0.35em] mb-1">
            {['Turn', 'messy'].map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={wordReveal}
                initial="hidden"
                animate="show"
                className="text-[var(--text)] inline-block"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              custom={2}
              variants={wordReveal}
              initial="hidden"
              animate="show"
              className="text-gradient inline-block"
            >
              spending
            </motion.span>
          </div>
          <div className="flex justify-center">
            <motion.span
              custom={3}
              variants={wordReveal}
              initial="hidden"
              animate="show"
              className="text-[var(--text)] inline-block"
            >
              into clarity.
            </motion.span>
          </div>
        </div>

        <motion.p
          variants={stagger(0.46)}
          initial="hidden"
          animate="show"
          className="text-lg md:text-xl text-[var(--text-muted)] max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Talk to Quillio in plain language. Upload your bank statements.
          It organises everything into clean records, charts, and monthly reports — automatically.
        </motion.p>

        <motion.div variants={stagger(0.56)} initial="hidden" animate="show">
          <ChatMockup onInteract={onSignup} />
        </motion.div>

        <motion.p
          variants={stagger(0.66)}
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
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <motion.div
          animate={{ opacity: [0.25, 0.7, 0.25], y: [0, 5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-transparent to-quillio-500/40"
        />
        <div className="w-1 h-1 rounded-full bg-quillio-500/40" />
      </motion.div>
    </section>
  );
}

// ── Animated Demo ─────────────────────────────────────────────────────────────
const DEMO_MSG_1 = 'spent 5k on fuel';
const DEMO_MSG_2 = 'got 50k salary from ProbeTech';
type DemoPhase = 'typing1' | 'loading1' | 'tx1' | 'typing2' | 'loading2' | 'tx2' | 'chart' | 'reset';

function useTypewriter(text: string, active: boolean, speed = 48) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) { setOut(''); return; }
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

function MiniChart({ visible }: { visible: boolean }) {
  const PATH = 'M0,45 C18,42 36,55 54,38 C72,21 90,35 108,28 C126,21 144,32 162,18 C168,14 174,16 180,12';
  return (
    <svg viewBox="0 0 180 60" className="w-full h-10" aria-hidden="true">
      <defs>
        <linearGradient id="mini-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={PATH + ' L180,60 L0,60 Z'}
        fill="url(#mini-fill)"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d={PATH}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={visible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

function DemoTxCard({
  type, amount, category, visible,
}: { type: 'expense' | 'income'; amount: number; category: string; visible: boolean }) {
  const isExpense = type === 'expense';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 18, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 18, scale: 0.95 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border p-3.5"
          style={{
            background: 'var(--card)',
            borderColor: isExpense ? 'rgba(248,113,113,0.22)' : 'rgba(16,185,129,0.22)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isExpense ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)',
                color: isExpense ? '#F87171' : '#10B981',
              }}
            >
              {isExpense ? '↓ Expense' : '↑ Income'}
            </span>
            <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
              <Check size={10} className="text-quillio-500" /> AI parsed
            </span>
          </div>
          <p
            className="font-display font-bold text-xl tabular"
            style={{ color: isExpense ? '#F87171' : '#10B981' }}
          >
            {isExpense ? '−' : '+'}₦{amount.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{category}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnimatedDemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });
  const [phase, setPhase] = useState<DemoPhase>('typing1');
  const [cycle, setCycle] = useState(0);

  const typed1 = useTypewriter(DEMO_MSG_1, inView && phase === 'typing1', 55);
  const typed2 = useTypewriter(DEMO_MSG_2, inView && phase === 'typing2', 46);

  useEffect(() => {
    if (!inView) return;

    const PHASES: { p: DemoPhase; after: number }[] = [
      { p: 'typing1',  after: DEMO_MSG_1.length * 55 + 280 },
      { p: 'loading1', after: 850 },
      { p: 'tx1',      after: 2100 },
      { p: 'typing2',  after: DEMO_MSG_2.length * 46 + 280 },
      { p: 'loading2', after: 850 },
      { p: 'tx2',      after: 1900 },
      { p: 'chart',    after: 2400 },
      { p: 'reset',    after: 1200 },
    ];

    let idx = 0;
    let tid: ReturnType<typeof setTimeout>;

    function tick() {
      if (idx >= PHASES.length) {
        setCycle(c => c + 1);
        setPhase('typing1');
        idx = 0;
        tid = setTimeout(tick, PHASES[0].after);
        return;
      }
      const { p, after } = PHASES[idx++];
      setPhase(p);
      tid = setTimeout(tick, after);
    }

    tick();
    return () => clearTimeout(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, cycle]);

  // Compute visibility flags — typed messages stay visible once typing completes
  const pastTyping1 = ['loading1', 'tx1', 'typing2', 'loading2', 'tx2', 'chart', 'reset'].includes(phase);
  const pastTyping2 = ['loading2', 'tx2', 'chart', 'reset'].includes(phase);
  const showMsg2    = phase === 'typing2' || pastTyping2;
  const showTx1     = ['tx1', 'typing2', 'loading2', 'tx2', 'chart', 'reset'].includes(phase);
  const showConf1   = showTx1;
  const showTx2     = ['tx2', 'chart', 'reset'].includes(phase);
  const showConf2   = showTx2;
  const showChart   = phase === 'chart' || phase === 'reset';

  return (
    <section className="py-20 px-6 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-3">See it in action</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[var(--text)]">
            Just say it. Quillio handles the rest.
          </h2>
          <p className="mt-4 text-[var(--text-muted)] max-w-lg mx-auto">
            Type a transaction in plain language. Quillio parses it instantly — no forms, no categories to pick.
          </p>
        </FadeIn>

        <div ref={ref} className="grid md:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {/* Chat panel */}
          <div className="md:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border)] bg-[var(--elevated)]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-quillio-500/50" />
              <span className="ml-3 text-xs text-[var(--text-subtle)] font-medium">Quillio chat</span>
            </div>

            <div className="p-4 space-y-3 min-h-[220px]">
              {/* Msg 1 — hidden until first char typed; stays visible thereafter */}
              {(pastTyping1 || typed1) && (
                <div className="flex justify-end">
                  <div className="bg-quillio-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm max-w-[82%]">
                    {pastTyping1 ? DEMO_MSG_1 : typed1}
                    {phase === 'typing1' && (
                      <span className="inline-block w-0.5 h-3.5 bg-white/70 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              )}

              {/* Loading1 / Conf1 */}
              <AnimatePresence mode="wait">
                {phase === 'loading1' && (
                  <motion.div key="l1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
                    <div className="bg-[var(--elevated)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3.5 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-quillio-500/55" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {showConf1 && (
                  <motion.div key="c1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="bg-[var(--elevated)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-[var(--text)]">
                      Got it! Logged your expense ✓
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Msg 2 */}
              <AnimatePresence>
                {showMsg2 && (
                  <motion.div key="m2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                    <div className="bg-quillio-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm max-w-[82%]">
                      {phase === 'typing2' ? typed2 : DEMO_MSG_2}
                      {phase === 'typing2' && (
                        <span className="inline-block w-0.5 h-3.5 bg-white/70 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading2 / Conf2 */}
              <AnimatePresence mode="wait">
                {phase === 'loading2' && (
                  <motion.div key="l2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
                    <div className="bg-[var(--elevated)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3.5 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-quillio-500/55" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {showConf2 && (
                  <motion.div key="c2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="bg-[var(--elevated)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-[var(--text)]">
                      Salary logged! Your balance looks great ↑
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cards + chart */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <DemoTxCard type="expense" amount={5000}  category="Transportation — Fuel"     visible={showTx1} />
            <DemoTxCard type="income"  amount={50000} category="Salary — ProbeTech"         visible={showTx2} />
            <AnimatePresence>
              {showChart && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
                >
                  <p className="text-xs text-[var(--text-subtle)] mb-2">This month</p>
                  <MiniChart visible={showChart} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Value props ───────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: <Check size={20} className="text-quillio-500" />,
    title: 'Structured',
    body: 'Every expense, income, and transfer — messy texts and statements go in, clean, categorised records come out.',
  },
  {
    icon: <Sparkles size={20} className="text-amber-400" />,
    title: 'Insightful',
    body: "AI reads your numbers and tells you what they mean. Spending trends, savings rate, and plain-English suggestions — not just charts.",
  },
  {
    icon: <FileSpreadsheet size={20} className="text-teal-400" />,
    title: 'Exportable',
    body: 'Download your records as a spreadsheet or PDF report any time. Your data, fully portable, ready for your accountant or tax return.',
  },
];

function ValuePropsSection() {
  return (
    <section className="py-24 px-6 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-3">Why Quillio</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[var(--text)]">
            Your money, written clearly.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5, boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}
                transition={{ duration: 0.2 }}
                className="group h-full p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-quillio-500/30 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 4 }}
                  transition={{ duration: 0.2 }}
                  className="w-10 h-10 rounded-xl bg-[var(--elevated)] flex items-center justify-center mb-4"
                >
                  {v.icon}
                </motion.div>
                <h3 className="font-display font-bold text-xl text-[var(--text)] mb-2">{v.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{v.body}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: <MessageSquare size={22} className="text-quillio-400" />,
    title: 'Talk to it — or upload',
    body: 'Send a message ("spent ₦4,200 on groceries"), forward a bank alert, voice-note a purchase, or drop in a statement PDF. Any format.',
    visual: (
      <div className="rounded-2xl p-6 min-h-[160px] md:h-48 flex items-center justify-center relative overflow-hidden" style={{ background: '#0A1810' }}>
        <div className="space-y-2 w-full max-w-[200px]">
          {[
            { text: 'spent 3k on lunch', delay: 0 },
            { text: '🎤 voice note…',    delay: 2.2 },
            { text: 'paid 15k rent',    delay: 4.4 },
          ].map(({ text, delay }) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: [0, 1, 1, 0], x: [-16, 0, 0, 0] }}
              transition={{ duration: 3.8, delay, repeat: Infinity, repeatDelay: 7.4 }}
              className="ml-auto w-fit px-3 py-1.5 rounded-full bg-quillio-500 text-white text-xs font-medium"
            >
              {text}
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '02',
    icon: <Zap size={22} className="text-quillio-lime" />,
    title: 'It organises automatically',
    body: "Quillio reads your input, classifies it (expense / income / savings / investment), picks the category, and stores a clean record in seconds.",
    visual: (
      <div className="rounded-2xl p-6 min-h-[160px] md:h-48 flex items-center justify-center relative overflow-hidden" style={{ background: '#0A1810' }}>
        {/* Animated parsing cards */}
        <div className="w-full max-w-[220px] space-y-2">
          {[
            { label: '↓ Expense', amount: '−₦3,000', cat: 'Food', color: '#F87171' },
            { label: '↑ Income',  amount: '+₦50,000', cat: 'Salary', color: '#10B981' },
          ].map(({ label, amount, cat, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.5, duration: 0.4 }}
              className="glass rounded-xl p-3 flex items-center gap-3"
            >
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                {label}
              </span>
              <div>
                <p className="text-white/90 text-sm font-bold tabular">{amount}</p>
                <p className="text-white/45 text-xs">{cat}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '03',
    icon: <BarChart3 size={22} className="text-teal-400" />,
    title: 'Get analytics & reports',
    body: 'See where your money goes, get AI-written budgeting suggestions, and export a full report — monthly or any custom period you choose.',
    visual: (
      <div className="rounded-2xl p-6 min-h-[160px] md:h-48 flex items-end justify-center relative overflow-hidden" style={{ background: '#0A1810' }}>
        <div className="flex items-end gap-1.5 h-28 w-full max-w-[200px]">
          {[55, 80, 42, 95, 60, 78, 38].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.7, delay: i * 0.09 + 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 rounded-t-md"
              style={{ background: i === 3 ? '#10B981' : 'rgba(16,185,129,0.22)' }}
            />
          ))}
        </div>
      </div>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="py-16 md:py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-3">How it works</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[var(--text)]">
            Three steps to financial clarity.
          </h2>
        </FadeIn>

        <div className="space-y-12 md:space-y-16">
          {STEPS.map((step, i) => (
            <FadeIn key={step.num} delay={0.05}>
              <div className={`grid md:grid-cols-2 gap-6 md:gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
                <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-xs font-bold text-[var(--text-subtle)]">{step.num}</span>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -4 }}
                      transition={{ duration: 0.18 }}
                      className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center"
                    >
                      {step.icon}
                    </motion.div>
                  </div>
                  <h3 className="font-display font-bold text-xl text-[var(--text)] mb-3">{step.title}</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed text-sm">{step.body}</p>
                </div>
                <div className={i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                  {step.visual}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Feature showcase ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    tag: 'Multimodal input',
    title: 'Every way you spend money — tracked.',
    body: "Type it, say it, forward the bank alert, or upload the statement. Quillio handles plain text, voice notes, CSV, Excel, and PDF — without you reformatting anything.",
    icon: <Upload size={16} />,
    bullets: ['Natural language chat', 'Voice note transcription', 'Statement PDF / CSV upload', 'Bank alert forwarding (WhatsApp & Telegram)'],
    visual: (
      <div className="rounded-2xl p-6 min-h-[180px] md:h-56 flex items-center justify-center relative overflow-hidden" style={{ background: '#0A1810' }}>
        {/* Channel icons */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
          {[
            { name: 'WhatsApp',  color: '#22C55E', icon: '💬' },
            { name: 'Telegram',  color: '#38BDF8', icon: '✈️' },
            { name: 'Web',       color: '#10B981', icon: '🌐' },
            { name: 'PDF',       color: '#F87171', icon: '📄' },
          ].map(({ name, color, icon }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.35 }}
              whileHover={{ scale: 1.06 }}
              className="glass rounded-xl p-3 flex flex-col items-center gap-1.5"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium" style={{ color }}>{name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    tag: 'AI budgeting insights',
    title: 'Your numbers explained in plain English.',
    body: "Not just pie charts. Quillio reads your spending pattern and writes you specific, actionable suggestions — like a financial advisor who already knows your data.",
    icon: <Sparkles size={16} />,
    bullets: ['Monthly spending summary', 'Category trends & overspend alerts', 'Savings rate tracking', 'Plain-English AI suggestions'],
    visual: (
      <div className="rounded-2xl p-6 min-h-[180px] md:h-56 flex flex-col justify-end relative overflow-hidden gap-3" style={{ background: '#0A1810' }}>
        {/* Bars */}
        <div className="flex items-end gap-1.5 h-24 w-full">
          {[60, 85, 45, 90, 55, 75, 40].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.75, delay: i * 0.08 + 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 rounded-t-md"
              style={{ background: i === 3 ? '#10B981' : 'rgba(16,185,129,0.2)' }}
            />
          ))}
        </div>
        {/* AI suggestion chip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="glass rounded-lg px-3 py-2 text-xs text-white/80 flex items-start gap-2"
        >
          <Sparkles size={12} className="text-quillio-400 mt-0.5 shrink-0" />
          <span>Food spend is 28% above last month. Consider a ₦15k weekly limit.</span>
        </motion.div>
      </div>
    ),
  },
  {
    tag: 'Export & reports',
    title: 'Your records, always portable.',
    body: "One click to download a polished spreadsheet or PDF report for any period. Share with your accountant, attach to a loan application, or just keep it for your records.",
    icon: <FileSpreadsheet size={16} />,
    bullets: ['XLSX spreadsheet export', 'PDF financial report', 'Custom date ranges', 'Monthly auto-report (coming soon)'],
    visual: (
      <div className="rounded-2xl p-6 min-h-[180px] md:h-56 flex items-center justify-center relative overflow-hidden" style={{ background: '#0A1810' }}>
        <div className="w-full max-w-[190px] space-y-3">
          {[
            { name: 'May-2025.xlsx', type: 'XLSX', color: '#10B981' },
            { name: 'Q1-Report.pdf', type: 'PDF',  color: '#F87171' },
          ].map(({ name, type, color }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.28 }}
              className="glass rounded-xl p-3 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {type}
              </div>
              <span className="text-white/80 text-xs truncate">{name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
];

function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-16 md:py-24 px-6 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
        <FadeIn className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-3">Features</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[var(--text)]">
            Built around how you actually spend.
          </h2>
        </FadeIn>

        {FEATURES.map((f, i) => (
          <FadeIn key={f.tag} delay={0.05}>
            <div className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
              <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-4">
                  {f.icon} {f.tag}
                </span>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-[var(--text)] mb-4">{f.title}</h3>
                <p className="text-[var(--text-muted)] text-base leading-relaxed mb-6">{f.body}</p>
                <ul className="space-y-2.5">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                      <Check size={14} className="text-quillio-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                {f.visual}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Social proof ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I just forwarded my bank alerts to Quillio and it sorted everything into categories by itself. My accountant was impressed.",
    name: 'Temi A.',
    role: 'Freelance designer, Lagos',
    initials: 'TA',
    color: '#10B981',
  },
  {
    quote: "Finally an expense tracker I actually use. I just chat with it the same way I'd text someone. It figures out the rest.",
    name: 'Kemi O.',
    role: 'Product manager',
    initials: 'KO',
    color: '#14B8A6',
  },
  {
    quote: "Uploaded 3 months of statements and had a full breakdown in minutes. The export to Excel alone saves me hours every quarter.",
    name: 'Chidi M.',
    role: 'Small business owner',
    initials: 'CM',
    color: '#A3E635',
  },
];

function SocialProofSection() {
  return (
    <section className="py-16 md:py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-quillio-500 text-quillio-600 mb-3">Early users</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-[var(--text)]">
            Built for your money.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
                className="h-full p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-4 cursor-default hover:border-quillio-500/20"
              >
                <p className="text-[var(--text)] text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ background: `${t.color}18`, color: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-subtle)]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTASection({ onSignup }: { onSignup: () => void }) {
  return (
    <section id="pricing" className="py-16 md:py-28 px-6 relative overflow-hidden" style={{ background: '#16A34A' }}>
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
            Free during beta
          </p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-6 leading-tight">
            Start organising your<br />money today.
          </h2>
          <p className="text-lg mb-10 leading-relaxed text-white/90">
            No credit card. No pricing tiers. Just Quillio — your AI-powered financial record keeper.
          </p>
          <motion.button
            onClick={onSignup}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-quillio-700 hover:bg-quillio-50 font-semibold text-lg transition-colors duration-150"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Get started free
            <ArrowRight size={20} />
          </motion.button>
          <p className="mt-4 text-xs text-white/70">Takes 30 seconds to set up.</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" showBeta />
        <div className="flex items-center gap-6 text-xs text-[var(--text-subtle)]">
          <Link to="/login"  className="hover:text-[var(--text-muted)] transition-colors">Log in</Link>
          <Link to="/signup" className="hover:text-[var(--text-muted)] transition-colors">Sign up</Link>
          <a href="mailto:hello@quillio.co" className="hover:text-[var(--text-muted)] transition-colors">Contact</a>
        </div>
        <span className="text-xs text-[var(--text-subtle)]">© {new Date().getFullYear()} Quillio</span>
      </div>
    </footer>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const handleSignup = () => navigate('/signup');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <HeroSection onSignup={handleSignup} />
      <AnimatedDemoSection />
      <ValuePropsSection />
      <HowItWorksSection />
      <FeatureShowcaseSection />
      <SocialProofSection />
      <FinalCTASection onSignup={handleSignup} />
      <Footer />
    </div>
  );
}
