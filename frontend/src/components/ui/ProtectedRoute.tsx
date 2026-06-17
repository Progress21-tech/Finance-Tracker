import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-quillio-500/30 border-t-quillio-500 animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
