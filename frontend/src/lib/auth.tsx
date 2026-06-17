import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  async function syncBackendUser() {
    try {
      const u = await api.me.sync();
      setUser(u);
    } catch {
      // Sync failed — still allow navigation, profile page will show the error
    }
  }

  async function refreshUser() {
    try {
      const u = await api.me.get();
      setUser(u);
    } catch {}
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session) syncBackendUser();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s) syncBackendUser();
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, authUser, user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
