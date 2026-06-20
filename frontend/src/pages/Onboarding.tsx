import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, SkipForward } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

// ── Step data ─────────────────────────────────────────────────────────────────

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

const INCOME_RANGES = [
  'Under ₦100k / month',
  '₦100k – ₦300k / month',
  '₦300k – ₦600k / month',
  '₦600k – ₦1M / month',
  'Over ₦1M / month',
  'Prefer not to say',
];

const CATEGORIES = [
  'Food & dining', 'Transport', 'Rent & housing', 'Data & airtime',
  'Utilities', 'Clothing', 'Entertainment', 'Healthcare',
  'Education', 'Savings', 'Investment', 'Business',
];

const GOALS = [
  { id: 'save_more',    label: 'Save more money',       emoji: '💰' },
  { id: 'invest',       label: 'Invest consistently',   emoji: '📈' },
  { id: 'cut_spending', label: 'Cut unnecessary spending', emoji: '✂️' },
  { id: 'just_track',  label: 'Just track everything', emoji: '📊' },
];

// ── Stepper ───────────────────────────────────────────────────────────────────

const TOTAL = 5;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step ? 'bg-quillio-500' : 'bg-[var(--border-strong)]'
          }`}
        />
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();

  // Guard: already completed onboarding → skip to dashboard
  useEffect(() => {
    if (!loading && user?.preferences?.onboarding_complete) {
      navigate('/app', { replace: true });
    }
  }, [user, loading, navigate]);

  const [step, setStep]   = useState(1);
  const [dir, setDir]     = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName]     = useState('');
  const [currency, setCurrency]           = useState('NGN');
  const [incomeRange, setIncomeRange]     = useState('');
  const [categories, setCategories]       = useState<string[]>([]);
  const [threshold, setThreshold]         = useState('10000');
  const [goal, setGoal]                   = useState('');

  function next() { setDir(1); setStep(s => Math.min(s + 1, TOTAL)); }
  function prev() { setDir(-1); setStep(s => Math.max(s - 1, 1)); }

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      await api.me.profile({
        display_name:        displayName || undefined,
        currency,
        daily_threshold:     Number(threshold) || 10000,
        monthly_income_range:incomeRange || undefined,
        top_categories:      categories.length ? categories : undefined,
        primary_goal:        goal || undefined,
        onboarding_complete: true,
      });
      await refreshUser();
      navigate('/app');
    } catch {
      // Best-effort — don't block navigation on profile save failure
      navigate('/app');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-10">
        <Logo size="md" showBeta />
      </div>

      <div className="w-full max-w-md">
        <ProgressBar step={step} />

        {/* Step card */}
        <div className="glass-light rounded-3xl p-8 shadow-glass overflow-hidden relative" style={{ minHeight: 340 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-8"
            >
              {step === 1 && (
                <Step
                  label="What should we call you?"
                  hint="We'll use this to personalise your experience."
                >
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/50 transition-all"
                  />
                </Step>
              )}

              {step === 2 && (
                <Step label="What's your primary currency?" hint="You can change this later in settings.">
                  <div className="flex flex-wrap gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                          currency === c
                            ? 'bg-quillio-500 border-quillio-500 text-white'
                            : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-quillio-500/40'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step label="Monthly income range?" hint="Optional — helps the AI set realistic budgets." optional>
                  <div className="space-y-2">
                    {INCOME_RANGES.map(r => (
                      <button
                        key={r}
                        onClick={() => setIncomeRange(r)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-150 flex items-center justify-between ${
                          incomeRange === r
                            ? 'bg-quillio-500/10 border-quillio-500/40 text-quillio-400'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {r}
                        {incomeRange === r && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {step === 4 && (
                <Step label="What do you spend on most?" hint="Pick as many as you like." optional>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                          categories.includes(cat)
                            ? 'bg-quillio-500/15 border-quillio-500/40 text-quillio-400'
                            : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-quillio-500/30'
                        }`}
                      >
                        {categories.includes(cat) && <span className="mr-1">✓</span>}
                        {cat}
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {step === 5 && (
                <Step label="What's your main financial goal?" hint="Quillio will tailor suggestions around this.">
                  <div className="space-y-2">
                    {GOALS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-150 flex items-center gap-3 ${
                          goal === g.id
                            ? 'bg-quillio-500/10 border-quillio-500/40 text-quillio-400'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <span className="text-lg">{g.emoji}</span>
                        <span>{g.label}</span>
                        {goal === g.id && <Check size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </Step>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prev}
            disabled={step === 1}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-3">
            {step < TOTAL && (
              <button
                onClick={next}
                className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] flex items-center gap-1 transition-colors"
              >
                <SkipForward size={12} /> Skip
              </button>
            )}
            {step < TOTAL ? (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 text-white text-sm font-medium transition-all duration-150 shadow-green-sm"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 disabled:opacity-60 text-white text-sm font-semibold transition-all duration-150 shadow-green-sm"
              >
                {saving ? 'Saving…' : 'Start using Quillio'} <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ label, hint, optional, children }: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">
          {label}
          {optional && <span className="text-xs font-normal text-[var(--text-subtle)] ml-2">(optional)</span>}
        </h2>
        {hint && <p className="text-sm text-[var(--text-muted)]">{hint}</p>}
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-thin pr-1">{children}</div>
    </div>
  );
}
