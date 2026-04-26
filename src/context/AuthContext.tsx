import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { repositories } from '@/repositories';
import type { AuthSession } from '@/repositories/types';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession to avoid missing the initial event.
    const unsubscribe = repositories.auth.onAuthChange((next) => {
      setSession(next);
      setLoading(false);
    });

    repositories.auth.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: useCallback((email, password, displayName) =>
      repositories.auth.signUp({ email, password, displayName }), []),
    signIn: useCallback((email, password) =>
      repositories.auth.signIn({ email, password }), []),
    signInWithGoogle: useCallback(() => repositories.auth.signInWithGoogle(), []),
    signOut: useCallback(() => repositories.auth.signOut(), []),
    resetPassword: useCallback((email) => repositories.auth.resetPassword(email), []),
    updatePassword: useCallback((pw) => repositories.auth.updatePassword(pw), []),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
