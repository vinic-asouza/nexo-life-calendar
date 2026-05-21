import { supabase } from '@/integrations/supabase/client';
import type { JournalRepository } from '../types';

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export const supabaseJournal: JournalRepository = {
  async getByDate(date) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('entry_date, content')
      .eq('entry_date', date)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { date: data.entry_date, content: data.content };
  },

  async upsert(date, content) {
    const user_id = await getUserId();
    const { error } = await supabase
      .from('journal_entries')
      .upsert({ user_id, entry_date: date, content } as never, { onConflict: 'user_id,entry_date' });
    if (error) throw error;
  },
};
