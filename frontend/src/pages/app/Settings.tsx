import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, LogOut, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { api } from '../../lib/api';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];
const GOALS = [
  { id: 'save_more',    label: 'Save more money' },
  { id: 'invest',       label: 'Invest consistently' },
  { id: 'cut_spending', label: 'Cut unnecessary spending' },
  { id: 'just_track',  label: 'Just track everything' },
];

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
      <h2 className="font-semibold text-sm text-[var(--text)]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
      <div className="sm:w-48 shrink-0">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {hint && <p className="text-xs text-[var(--text-subtle)] mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function AppSettings() {
  const { user, signOut, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [name, setName]           = useState(user?.display_name ?? '');
  const [currency, setCurrency]   = useState(user?.currency ?? 'NGN');
  const [threshold, setThreshold] = useState(String(user?.daily_threshold ?? 10000));
  const [whatsapp, setWhatsapp]   = useState(user?.whatsapp_number ?? '');
  const [telegram, setTelegram]   = useState(user?.telegram_chat_id ?? '');
  const [goal, setGoal]           = useState(user?.preferences?.primary_goal ?? '');
  const [saved, setSaved]         = useState(false);

  const update = useMutation({
    mutationFn: () => api.me.profile({
      display_name:     name || undefined,
      currency,
      daily_threshold:  Number(threshold) || 10000,
      whatsapp_number:  whatsapp || undefined,
      telegram_chat_id: telegram || undefined,
      primary_goal:     goal || undefined,
    }),
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--text)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <SettingSection title="Profile">
        <Field label="Display name" hint="How Quillio greets you">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/50 transition-all"
          />
        </Field>
        <Field label="Currency" hint="Used for all displayed amounts">
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  currency === c
                    ? 'bg-quillio-500 border-quillio-500 text-white'
                    : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-quillio-500/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Daily threshold" hint="Alert when daily spending exceeds this">
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-subtle)]">{currency}</span>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full pl-12 pr-3 py-2 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-quillio-500/50 tabular transition-all"
            />
          </div>
        </Field>
        <Field label="Financial goal">
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  goal === g.id
                    ? 'bg-quillio-500/15 border-quillio-500/40 text-quillio-400'
                    : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-quillio-500/30'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Field>
      </SettingSection>

      {/* Channels */}
      <SettingSection title="Connected channels">
        <p className="text-xs text-[var(--text-subtle)] -mt-1">Link your WhatsApp or Telegram so you can log transactions by message.</p>
        <Field label="WhatsApp number" hint="Include country code, e.g. +2348012345678">
          <input
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="+2348012345678"
            className="w-full max-w-xs px-3 py-2 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/50 transition-all"
          />
        </Field>
        <Field label="Telegram chat ID" hint="Your numeric Telegram user ID">
          <input
            value={telegram}
            onChange={e => setTelegram(e.target.value)}
            placeholder="123456789"
            className="w-full max-w-xs px-3 py-2 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none focus:border-quillio-500/50 transition-all"
          />
        </Field>
      </SettingSection>

      {/* Appearance */}
      <SettingSection title="Appearance">
        <Field label="Theme" hint="Currently: light or dark">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-[var(--text-muted)] capitalize">{theme} mode</span>
          </div>
        </Field>
      </SettingSection>

      {/* Plan */}
      <SettingSection title="Plan">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-quillio-500/15 border border-quillio-500/20 text-quillio-400 text-xs font-semibold">
            ✦ Beta
          </span>
          <span className="text-sm text-[var(--text-muted)]">Free during beta — no limits, no credit card.</span>
        </div>
      </SettingSection>

      {/* Save + sign out */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => update.mutate()}
          disabled={update.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quillio-500 hover:bg-quillio-400 disabled:opacity-60 text-white text-sm font-medium transition-all shadow-green-sm"
        >
          {update.isPending ? 'Saving…' : saved ? <><Check size={15} /> Saved</> : 'Save changes'}
        </button>

        <a
          href="mailto:hello@quillio.co"
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors ml-auto"
        >
          <ExternalLink size={14} /> Help & feedback
        </a>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
