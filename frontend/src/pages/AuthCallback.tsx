import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/ui/Logo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Safety valve — if sync never resolves after 10s, bail to login
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.preferences?.onboarding_complete) {
      navigate('/app', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, navigate]);

  if (timedOut) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-4 text-center px-6">
        <Logo size="md" />
        <p className="text-[var(--text-muted)] text-sm mt-2">
          Something went wrong finishing sign-in.{' '}
          <a href="/login" className="text-quillio-500 hover:text-quillio-400 underline transition-colors">
            Try again
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-6">
      <Logo size="md" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-quillio-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
