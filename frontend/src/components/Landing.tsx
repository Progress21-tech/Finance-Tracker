import { useState, FormEvent } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Connect your WhatsApp',
    desc: 'Add the bot number to your contacts and send a message to get started.',
  },
  {
    number: '02',
    title: 'Talk to it naturally',
    desc: 'Text "spent 5k on fuel", forward a bank alert, or send a voice note. It understands.',
  },
  {
    number: '03',
    title: 'Get monthly reports',
    desc: 'Receive an AI-written summary + a full Excel spreadsheet on the 1st of every month.',
  },
];

const FEATURES = [
  {
    icon: '🎙️',
    title: 'Voice notes',
    desc: 'Send a voice note, we transcribe it and record the transaction automatically.',
  },
  {
    icon: '🏦',
    title: 'Bank alert parsing',
    desc: 'Forward GTBank, Access, Kuda, OPay, UBA alerts — parsed and stored instantly.',
  },
  {
    icon: '📄',
    title: 'Statement upload',
    desc: 'Upload a PDF or CSV bank statement. Duplicates are removed automatically.',
  },
  {
    icon: '⚠️',
    title: 'Daily spending alerts',
    desc: 'Set a daily limit. Get a WhatsApp nudge the moment you cross it.',
  },
  {
    icon: '📊',
    title: 'Monthly reports',
    desc: 'AI-narrated summary plus a detailed Excel sheet — delivered to WhatsApp.',
  },
  {
    icon: '✏️',
    title: 'Easy corrections',
    desc: 'Every record is editable. Low-confidence parses are flagged for your review.',
  },
];

const EXAMPLES = [
  { input: 'spent 5k on fuel', output: '₦5,000 — Expense / Fuel' },
  { input: 'got 250k salary from ProbeTech', output: '₦250,000 — Income / ProbeTech' },
  { input: 'moved 50k to savings', output: '₦50,000 — Saving' },
  { input: 'bought 100k of USDT', output: '₦100,000 — Investment / Crypto' },
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeExample, setActiveExample] = useState(0);

  function handleWaitlist(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="font-semibold tracking-tight">FinanceTracker</span>
          </div>
          <a
            href="#waitlist"
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm font-medium transition-colors"
          >
            Join waitlist
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            WhatsApp-first · AI-powered · Built for Nigeria
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Your money,{' '}
            <span className="text-gradient">explained to you</span>
            <br />on WhatsApp
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Text it, voice-note it, or forward your bank alert. Finance Tracker records
            every naira in or out — and gives you a clear monthly report.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#waitlist"
              className="px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 font-semibold text-lg transition-colors glow-green"
            >
              Join the waitlist
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 font-semibold text-lg text-slate-300 hover:text-white transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Live example ─────────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-sm text-slate-500 mb-4 uppercase tracking-widest">Try an example</p>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
            {/* WhatsApp-style chat bubbles */}
            <div className="p-6 space-y-3">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExample(i)}
                  className={`w-full text-left transition-all ${activeExample === i ? '' : 'opacity-40 hover:opacity-70'}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="self-end max-w-xs bg-brand-600/80 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm">
                      {ex.input}
                    </div>
                    {activeExample === i && (
                      <div className="self-start max-w-xs bg-slate-800 text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm border border-white/5">
                        ✅ Recorded {ex.output}
                        <br />
                        <span className="text-slate-500 text-xs">Reply <em>edit</em> to change.</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How it works</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
            No apps to install. No dashboards to open. Just WhatsApp.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative p-8 rounded-2xl bg-slate-900/60 border border-white/5">
                <div className="text-5xl font-black text-brand-600/20 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
            Built for how Nigerians actually move money.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-brand-600/30 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / social proof ─────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { value: '< 2s', label: 'Avg parse time' },
            { value: '7+', label: 'Nigerian banks supported' },
            { value: '100%', label: 'WhatsApp-native' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-black text-gradient mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Waitlist form ────────────────────────────────────────────────── */}
      <section id="waitlist" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get early access</h2>
          <p className="text-slate-400 mb-10">
            Drop your email and we'll reach out when a spot opens up.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-brand-600/10 border border-brand-600/20">
              <div className="text-3xl mb-3">🎉</div>
              <p className="font-semibold text-brand-400">You're on the list!</p>
              <p className="text-slate-400 text-sm mt-1">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 rounded-xl bg-slate-900 border border-white/10 focus:border-brand-600/50 focus:outline-none text-white placeholder-slate-500 transition-colors"
              />
              <button
                type="submit"
                className="px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 font-semibold transition-colors whitespace-nowrap"
              >
                Join waitlist
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <span>💰</span>
            <span className="font-medium text-white">FinanceTracker</span>
            <span>by ProbeTech</span>
          </div>
          <p>© {new Date().getFullYear()} ProbeTech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
