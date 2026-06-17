import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, LayoutDashboard, List, BarChart3,
  FileText, Upload, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuth } from '../../lib/auth';

const NAV = [
  { to: '/app',              icon: MessageSquare,   label: 'Chat',         end: true },
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/transactions', icon: List,            label: 'Transactions' },
  { to: '/app/analytics',    icon: BarChart3,       label: 'Analytics' },
  { to: '/app/reports',      icon: FileText,        label: 'Reports' },
  { to: '/app/upload',       icon: Upload,          label: 'Upload' },
  { to: '/app/settings',     icon: Settings,        label: 'Settings' },
];

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-quillio-500/20 text-quillio-400 text-xs font-bold flex items-center justify-center border border-quillio-500/20">
      {initials}
    </div>
  );
}

// ── Desktop icon rail ─────────────────────────────────────────────────────────
function IconRail({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0
        glass border-r border-[var(--border)] z-40
        transition-all duration-300
        ${collapsed ? 'w-[68px]' : 'w-52'}
      `}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border)]">
        {!collapsed && <Logo size="sm" showBeta />}
        {collapsed && <Logo size="sm" markOnly />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-white/5 transition-all ml-auto"
        >
          <Menu size={15} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-quillio-500/15 text-quillio-400 border border-quillio-500/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={`shrink-0 ${isActive ? 'text-quillio-400' : ''}`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + theme + sign out */}
      <div className="px-2 py-3 border-t border-[var(--border)] space-y-1">
        <ThemeToggle className="w-full justify-start px-3 py-2 rounded-xl" />

        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <Avatar name={user.display_name} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text)] truncate">{user.display_name ?? 'You'}</p>
              <p className="text-[10px] text-[var(--text-subtle)] truncate capitalize">{user.plan}</p>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center px-2 py-1">
            <Avatar name={user.display_name} />
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

// ── Mobile bottom bar ─────────────────────────────────────────────────────────
function MobileBottomBar() {
  const PRIMARY_NAV = NAV.slice(0, 5); // Chat, Dashboard, Txns, Analytics, Reports
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-[var(--border)] px-2 py-1.5 flex items-center justify-around">
      {PRIMARY_NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive ? 'text-quillio-400' : 'text-[var(--text-subtle)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[9px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Mobile top bar ────────────────────────────────────────────────────────────
function MobileTopBar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 glass border-b border-[var(--border)]">
        <Logo size="sm" showBeta />
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-0 z-40 pt-14"
          >
            <div className="absolute inset-0 bg-[var(--bg)]/80 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
            <nav className="relative z-10 glass border-l border-[var(--border)] h-full w-64 ml-auto px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {NAV.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-quillio-500/15 text-quillio-400'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
              <div className="mt-auto pt-4 border-t border-[var(--border)]">
                <button
                  onClick={async () => { setMenuOpen(false); await signOut(); navigate('/'); }}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      {/* Desktop rail */}
      <IconRail collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile top bar + drawer */}
      <MobileTopBar menuOpen={mobileMenu} setMenuOpen={setMobileMenu} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin md:pt-0 pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <MobileBottomBar />
    </div>
  );
}
