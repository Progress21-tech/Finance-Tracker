import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Logo } from '../components/ui/Logo';

const palette = [
  { label: 'quillio-950',  hex: '#0B3D2E' },
  { label: 'quillio-900',  hex: '#064E3B' },
  { label: 'quillio-700',  hex: '#047857' },
  { label: 'quillio-600',  hex: '#16A34A' },
  { label: 'quillio-500',  hex: '#10B981' },
  { label: 'quillio-400',  hex: '#34D399' },
  { label: 'quillio-300',  hex: '#6EE7B7' },
  { label: 'quillio-100',  hex: '#D1FAE5' },
  { label: 'quillio-lime', hex: '#A3E635' },
];

const semantic = [
  { label: 'income',     hex: '#10B981', desc: 'credit / positive' },
  { label: 'expense',    hex: '#F87171', desc: 'debit / negative' },
  { label: 'saving',     hex: '#14B8A6', desc: 'savings bucket' },
  { label: 'investment', hex: '#F59E0B', desc: 'investment bucket' },
];

const surfaces = [
  { label: '--bg',           var: 'var(--bg)' },
  { label: '--surface',      var: 'var(--surface)' },
  { label: '--card',         var: 'var(--card)' },
  { label: '--elevated',     var: 'var(--elevated)' },
];

export default function TokenDemo() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)]">
        <Logo size="md" showBeta />
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">Checkpoint 1 — Design Tokens</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 space-y-16">

        {/* Typography */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Typography</h2>
          <div className="space-y-4">
            <p className="font-display text-display-2xl font-black text-gradient leading-none">Display 2XL</p>
            <p className="font-display text-display-xl font-bold">Display XL — Satoshi</p>
            <p className="font-display text-display-lg font-bold">Display LG — Finance clarity.</p>
            <p className="font-display text-display-md font-semibold">Display MD — Turn messy spending into clarity.</p>
            <p className="font-display text-display-sm font-semibold">Display SM — Your money, written clearly.</p>
            <p className="text-2xl font-semibold">Body XL — Inter 2xl semi</p>
            <p className="text-xl">Body XL — Inter xl regular</p>
            <p className="text-base">Body base — The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-[var(--text-muted)]">Body SM muted — Secondary text, captions, metadata.</p>
            <p className="text-xs text-[var(--text-subtle)]">Body XS subtle — Labels, hints, timestamps.</p>
            <p className="font-mono text-base tabular text-quillio-400">₦ 1,234,567.89 — mono tabular numbers</p>
          </div>
        </section>

        {/* Brand palette */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Brand Palette</h2>
          <div className="flex flex-wrap gap-3">
            {palette.map(c => (
              <div key={c.label} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-xl shadow-sm border border-[var(--border)]" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] text-[var(--text-subtle)] text-center leading-tight">{c.label}<br />{c.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Semantic colors */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Semantic Colors</h2>
          <div className="flex flex-wrap gap-4">
            {semantic.map(c => (
              <div key={c.label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: c.hex }} />
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.desc} — {c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CSS Variable surfaces */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Surface Tokens</h2>
          <div className="flex flex-wrap gap-3">
            {surfaces.map(s => (
              <div
                key={s.label}
                className="w-36 h-20 rounded-xl flex flex-col items-center justify-center border border-[var(--border-strong)] shadow-sm"
                style={{ background: s.var }}
              >
                <span className="text-[11px] font-mono text-[var(--text-muted)]">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mesh gradient */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Mesh Gradient</h2>
          <div className="mesh-bg rounded-2xl h-48 flex items-center justify-center">
            <p className="font-display text-display-sm font-bold text-white/90 drop-shadow-lg">Green mesh gradient</p>
          </div>
        </section>

        {/* Glass cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Glassmorphism</h2>
          <div className="mesh-bg rounded-2xl p-8">
            <div className="flex flex-wrap gap-4">
              <div className="glass rounded-2xl p-6 w-56">
                <p className="text-xs text-white/50 mb-1">Glass card (dark)</p>
                <p className="font-display text-2xl font-bold text-white">₦ 284,500</p>
                <p className="text-sm text-white/60 mt-1">Total income this month</p>
              </div>
              <div className="glass-light rounded-2xl p-6 w-56">
                <p className="text-xs text-[var(--text-muted)] mb-1">Glass-light card</p>
                <p className="font-display text-2xl font-bold text-[var(--text)]">₦ 112,300</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Total expenses</p>
              </div>
            </div>
          </div>
        </section>

        {/* Animations */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] mb-6">Motion & Glow</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-quillio-500 animate-float glow-green" />
            <div className="w-16 h-16 rounded-2xl bg-quillio-500/20 border border-quillio-500/30 animate-pulse" />
            <div className="skeleton w-40 h-6 rounded-lg" />
            <div className="skeleton w-24 h-6 rounded-lg" />
            <div className="px-4 py-2 bg-quillio-500 text-white font-medium rounded-xl hover:bg-quillio-400 transition-colors duration-150 cursor-pointer glow-green-sm">
              Button primary
            </div>
            <div className="px-4 py-2 bg-transparent text-quillio-400 font-medium rounded-xl border border-quillio-500/40 hover:border-quillio-400 transition-colors duration-150 cursor-pointer">
              Button outline
            </div>
          </div>
        </section>

        <p className="text-sm text-[var(--text-subtle)] pb-12">
          ✓ Checkpoint 1 complete — tokens, palette, surfaces, typography, mesh gradient, glass, and theme toggle verified.
          Toggle the sun/moon icon above to confirm light/dark mode persists.
        </p>
      </main>
    </div>
  );
}
