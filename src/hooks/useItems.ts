import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CalendarItem, FilterState } from '@/types';
import { repositories } from '@/repositories';
import { useAuth } from '@/context/AuthContext';
import { parseISO, startOfDay, getDay, format } from 'date-fns';

const QK = ['items'] as const;

export function useItems() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: [...QK, user?.id],
    queryFn: () => repositories.items.list(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [...QK, user?.id] });

  const addMutation = useMutation({
    mutationFn: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => repositories.items.create(item),
    onSuccess: (created) => {
      qc.setQueryData<CalendarItem[]>([...QK, user?.id], (prev = []) => [...prev, created]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>> }) =>
      repositories.items.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: [...QK, user?.id] });
      const prev = qc.getQueryData<CalendarItem[]>([...QK, user?.id]);
      qc.setQueryData<CalendarItem[]>([...QK, user?.id], (curr = []) =>
        curr.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData([...QK, user?.id], ctx.prev);
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repositories.items.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [...QK, user?.id] });
      const prev = qc.getQueryData<CalendarItem[]>([...QK, user?.id]);
      qc.setQueryData<CalendarItem[]>([...QK, user?.id], (curr = []) => curr.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData([...QK, user?.id], ctx.prev);
    },
    onSettled: invalidate,
  });

  const addItem = useCallback(
    (item: Omit<CalendarItem, 'id' | 'createdAt'>) => addMutation.mutateAsync(item),
    [addMutation],
  );
  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>) =>
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation],
  );
  const deleteItem = useCallback(
    (id: string, occurrenceDate?: string) => {
      if (occurrenceDate) {
        const current = qc.getQueryData<CalendarItem[]>([...QK, user?.id]) ?? [];
        const item = current.find((i) => i.id === id);
        if (item?.recurrence) {
          const excluded = item.excludedDates ?? [];
          if (excluded.includes(occurrenceDate)) return Promise.resolve();
          return updateMutation.mutateAsync({
            id,
            updates: {
              excludedDates: [...excluded, occurrenceDate],
              completedDates: (item.completedDates ?? []).filter((d) => d !== occurrenceDate),
            },
          });
        }
      }
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation, updateMutation, qc, user?.id],
  );

  const toggleStatus = useCallback(
    (id: string, occurrenceDate?: string) => {
      const current = qc.getQueryData<CalendarItem[]>([...QK, user?.id]) ?? [];
      const item = current.find((i) => i.id === id);
      if (!item) return Promise.resolve();
      if (item.recurrence && occurrenceDate) {
        const completed = item.completedDates ?? [];
        const isDone = completed.includes(occurrenceDate);
        return updateItem(id, {
          completedDates: isDone ? completed.filter((d) => d !== occurrenceDate) : [...completed, occurrenceDate],
        });
      }
      return updateItem(id, { status: item.status === 'done' ? 'pending' : 'done' });
    },
    [qc, updateItem, user?.id],
  );

  return { items, addItem, updateItem, deleteItem, toggleStatus };
}

// Check if an item is "done" for a given date
export function isItemDoneOnDate(item: CalendarItem, dateStr: string): boolean {
  if (item.recurrence) return item.completedDates?.includes(dateStr) ?? false;
  return item.status === 'done';
}

function recurringFallsOnDate(item: CalendarItem, date: Date): boolean {
  if (!item.recurrence) return false;
  const itemStart = startOfDay(parseISO(item.startDate));
  if (date < itemStart) return false;
  const endStr = item.recurrence.endDate ?? item.endDate;
  if (endStr) {
    const recurrenceEnd = startOfDay(parseISO(endStr));
    if (date > recurrenceEnd) return false;
  }
  const dayOfWeek = getDay(date);
  switch (item.recurrence.type) {
    case 'daily': return true;
    case 'weekly': return getDay(itemStart) === dayOfWeek;
    case 'monthly': return itemStart.getDate() === date.getDate();
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'custom': return item.recurrence.customDays?.includes(dayOfWeek) ?? false;
    default: return false;
  }
}

export function getItemsForDate(items: CalendarItem[], date: Date, filters: FilterState): CalendarItem[] {
  const target = startOfDay(date);
  return items.filter((item) => {
    if (!filters.areaIds.includes(item.areaId)) return false;
    if (!filters.typeIds.includes(item.typeId)) return false;
    const itemStart = startOfDay(parseISO(item.startDate));
    const itemEnd = item.endDate ? startOfDay(parseISO(item.endDate)) : itemStart;
    const dateStr = format(target, 'yyyy-MM-dd');
    if (item.excludedDates?.includes(dateStr)) return false;
    if (target >= itemStart && target <= itemEnd) return true;
    if (item.recurrence && recurringFallsOnDate(item, target)) return true;
    return false;
  });
}
