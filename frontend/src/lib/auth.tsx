import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { api, User } from './api';

interface AuthCtx {
  session:    Session | null;
  authUser:   SupabaseUser | null;
  user:       User | null;
  loading:    boolean;
  signOut:    () => Promise<void>;
  refreshUser:() => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null, authUser: null, user: null, loading: true,
  signOut: async () => {}, refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  // Track the last synced uid so token refreshes don't re-trigger sync
  const syncedUidRef = useRef<string | null>(null);

  async function doSync() {
    try {
      const u = await api.me.sync();
      setUser(u);
    } catch (err) {
      console.error('[auth] /me/sync failed:', err);
    }
  }

  async function refreshUser() {
    try {
      const u = await api.me.get();
      setUser(u);
    } catch {}
  }

  useEffect(() => {
    // On mount: resolve session, await sync, THEN clear loading.
    // Awaiting sync ensures no app data queries fire before the user row exists.
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s) {
        syncedUidRef.current = s.user.id;
        await doSync();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setAuthUser(s?.user ?? null);

      if (!s) {
        setUser(null);
        syncedUidRef.current = null;
        return;
      }

      // Only sync when uid changes (new login, not a token refresh)
      if (s.user.id !== syncedUidRef.current) {
        setLoading(true);
        syncedUidRef.current = s.user.id;
        await doSync();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    syncedUidRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ session, authUser, user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
