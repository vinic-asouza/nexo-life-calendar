import { supabase } from '@/integrations/supabase/client';
import type { AuthRepository, AuthSession, SignInInput, SignUpInput, AuthChangeCallback } from '../types';

function toSession(session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null; access_token: string } | null): AuthSession | null {
  if (!session?.user) return null;
  return {
    accessToken: session.access_token,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      displayName: (session.user.user_metadata?.display_name as string | undefined) ?? null,
    },
  };
}

export const supabaseAuth: AuthRepository = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return toSession(data.session);
  },

  onAuthChange(cb: AuthChangeCallback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(toSession(session));
    });
    return () => data.subscription.unsubscribe();
  },

  async signUp({ email, password, displayName }: SignUpInput) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: displayName ? { display_name: displayName } : undefined,
      },
    });
    if (error) throw error;
  },

  async signIn({ email, password }: SignInInput) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};
