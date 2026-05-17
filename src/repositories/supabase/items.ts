import { supabase } from '@/integrations/supabase/client';
import type { CalendarItem, ChecklistItem, Comment, Recurrence } from '@/types';
import type { ItemsRepository } from '../types';

type ItemRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  area_id: string | null;
  type_id: string | null;
  recurrence: Recurrence | null;
  notes: string | null;
  status: 'pending' | 'done';
  completed_dates: string[] | null;
  checklist: ChecklistItem[] | null;
  comments: Comment[] | null;
  created_at: string;
};

const toDomain = (r: ItemRow): CalendarItem => ({
  id: r.id,
  title: r.title,
  startDate: r.start_date,
  endDate: r.end_date ?? undefined,
  startTime: r.start_time ? r.start_time.slice(0, 5) : undefined,
  endTime: r.end_time ? r.end_time.slice(0, 5) : undefined,
  areaId: r.area_id ?? '',
  typeId: r.type_id ?? '',
  recurrence: r.recurrence ?? undefined,
  notes: r.notes ?? undefined,
  status: r.status,
  completedDates: r.completed_dates ?? undefined,
  checklist: r.checklist ?? undefined,
  comments: r.comments ?? undefined,
  createdAt: r.created_at,
});

type RowPatch = {
  title?: string;
  start_date?: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  area_id?: string | null;
  type_id?: string | null;
  recurrence?: Recurrence | null;
  notes?: string | null;
  status?: 'pending' | 'done';
  completed_dates?: string[];
  checklist?: ChecklistItem[];
  comments?: Comment[];
};

const toRow = (item: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>): RowPatch => {
  const row: RowPatch = {};
  if (item.title !== undefined) row.title = item.title;
  if (item.startDate !== undefined) row.start_date = item.startDate;
  if ('endDate' in item) row.end_date = item.endDate ?? null;
  if ('startTime' in item) row.start_time = item.startTime ?? null;
  if ('endTime' in item) row.end_time = item.endTime ?? null;
  if (item.areaId !== undefined) row.area_id = item.areaId || null;
  if (item.typeId !== undefined) row.type_id = item.typeId || null;
  if ('recurrence' in item) row.recurrence = item.recurrence ?? null;
  if ('notes' in item) row.notes = item.notes ?? null;
  if (item.status !== undefined) row.status = item.status;
  if (item.completedDates !== undefined) row.completed_dates = item.completedDates;
  if (item.checklist !== undefined) row.checklist = item.checklist;
  if (item.comments !== undefined) row.comments = item.comments;
  return row;
};

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

const SELECT = 'id, title, start_date, end_date, start_time, end_time, area_id, type_id, recurrence, notes, status, completed_dates, checklist, comments, created_at';

export const supabaseItems: ItemsRepository = {
  async list() {
    const { data, error } = await supabase
      .from('items')
      .select(SELECT)
      .order('start_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => toDomain(r as unknown as ItemRow));
  },

  async create(item) {
    const user_id = await getUserId();
    const insertRow = { user_id, start_date: item.startDate, title: item.title, ...toRow(item) } as never;
    const { data, error } = await supabase
      .from('items')
      .insert(insertRow)
      .select(SELECT)
      .single();
    if (error) throw error;
    return toDomain(data as unknown as ItemRow);
  },

  async update(id, updates) {
    const { error } = await supabase.from('items').update(toRow(updates) as never).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  },
};
