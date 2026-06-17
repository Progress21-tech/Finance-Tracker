import { Outlet } from 'react-router-dom';

// Checkpoint 5 — will be replaced with the full app shell + icon rail
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Outlet />
    </div>
  );
}
