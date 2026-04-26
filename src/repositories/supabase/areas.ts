import { supabase } from '@/integrations/supabase/client';
import type { Area } from '@/types';
import type { AreasRepository } from '../types';

type AreaRow = { id: string; name: string; color: string; position: number };

const toDomain = (r: AreaRow): Area => ({ id: r.id, name: r.name, color: r.color });

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export const supabaseAreas: AreasRepository = {
  async list() {
    const { data, error } = await supabase
      .from('areas')
      .select('id, name, color, position')
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toDomain);
  },

  async create(area) {
    const user_id = await getUserId();
    const { data: countRows } = await supabase.from('areas').select('id', { count: 'exact', head: true });
    const position = countRows ? 0 : 0; // count not used; default position handled below
    const { data, error } = await supabase
      .from('areas')
      .insert({ user_id, name: area.name, color: area.color, position })
      .select('id, name, color, position')
      .single();
    if (error) throw error;
    return toDomain(data as AreaRow);
  },

  async update(id, updates) {
    const patch: Partial<AreaRow> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.color !== undefined) patch.color = updates.color;
    const { error } = await supabase.from('areas').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(orderedIds) {
    await Promise.all(
      orderedIds.map((id, position) =>
        supabase.from('areas').update({ position }).eq('id', id)
      )
    );
  },
};
