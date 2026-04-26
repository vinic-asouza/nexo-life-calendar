import { supabase } from '@/integrations/supabase/client';
import type { ItemType } from '@/types';
import type { TypesRepository } from '../types';

type TypeRow = { id: string; name: string; position: number };
const toDomain = (r: TypeRow): ItemType => ({ id: r.id, name: r.name });

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export const supabaseTypes: TypesRepository = {
  async list() {
    const { data, error } = await supabase
      .from('types')
      .select('id, name, position')
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toDomain);
  },

  async create(t) {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from('types')
      .insert({ user_id, name: t.name, position: 0 })
      .select('id, name, position')
      .single();
    if (error) throw error;
    return toDomain(data as TypeRow);
  },

  async update(id, updates) {
    const patch: Partial<TypeRow> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    const { error } = await supabase.from('types').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('types').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(orderedIds) {
    await Promise.all(
      orderedIds.map((id, position) =>
        supabase.from('types').update({ position }).eq('id', id)
      )
    );
  },
};
