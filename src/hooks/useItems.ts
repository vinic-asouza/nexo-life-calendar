import { useState, useCallback, useEffect } from 'react';
import { CalendarItem, FilterState } from '@/types';
import { getItems, parseStoredItems, saveItems } from '@/services/storage';
import { parseISO, startOfDay, getDay } from 'date-fns';

const STORAGE_KEY = 'nexo_items';

export function useItems() {
  const [items, setItems] = useState<CalendarItem[]>(getItems);

  // Functional updater: state is the source of truth, storage is a mirror.
  const mutate = useCallback((updater: (prev: CalendarItem[]) => CalendarItem[]) => {
    setItems(prev => {
      const next = updater(prev);
      saveItems(next);
      return next;
    });
  }, []);

  // Cross-tab sync: listen to storage events from other tabs.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      setItems(parseStoredItems(e.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addItem = useCallback((item: Omit<CalendarItem, 'id' | 'createdAt'>) => {
    const newItem: CalendarItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    mutate(prev => [...prev, newItem]);
    return newItem;
  }, [mutate]);

  const updateItem = useCallback((id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>) => {
    mutate(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [mutate]);

  const deleteItem = useCallback((id: string) => {
    mutate(prev => prev.filter(i => i.id !== id));
  }, [mutate]);

  const toggleStatus = useCallback((id: string, occurrenceDate?: string) => {
    mutate(prev => prev.map(i => {
      if (i.id !== id) return i;
      // Recurring items: track per-date completion
      if (i.recurrence && occurrenceDate) {
        const completed = i.completedDates || [];
        const isDone = completed.includes(occurrenceDate);
        return {
          ...i,
          completedDates: isDone
            ? completed.filter(d => d !== occurrenceDate)
            : [...completed, occurrenceDate],
        };
      }
      // Non-recurring: toggle global status
      return { ...i, status: i.status === 'done' ? 'pending' as const : 'done' as const };
    }));
  }, [mutate]);

  return { items, addItem, updateItem, deleteItem, toggleStatus };
}

// Check if an item is "done" for a given date
export function isItemDoneOnDate(item: CalendarItem, dateStr: string): boolean {
  if (item.recurrence) {
    return item.completedDates?.includes(dateStr) ?? false;
  }
  return item.status === 'done';
}

// Check if a recurring item falls on a specific date
function recurringFallsOnDate(item: CalendarItem, date: Date): boolean {
  if (!item.recurrence) return false;
  const itemStart = startOfDay(parseISO(item.startDate));
  if (date < itemStart) return false;

  // Respect recurrence end: prefer recurrence.endDate, fallback to item.endDate
  const endStr = item.recurrence.endDate ?? item.endDate;
  if (endStr) {
    const recurrenceEnd = startOfDay(parseISO(endStr));
    if (date > recurrenceEnd) return false;
  }

  const dayOfWeek = getDay(date);

  switch (item.recurrence.type) {
    case 'daily':
      return true;
    case 'weekly':
      return getDay(itemStart) === dayOfWeek;
    case 'monthly':
      return itemStart.getDate() === date.getDate();
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'custom':
      return item.recurrence.customDays?.includes(dayOfWeek) ?? false;
    default:
      return false;
  }
}

export function getItemsForDate(items: CalendarItem[], date: Date, filters: FilterState): CalendarItem[] {
  const target = startOfDay(date);

  return items.filter(item => {
    // Filter by area and type — selection is explicit: only items in selected sets are shown.
    if (!filters.areaIds.includes(item.areaId)) return false;
    if (!filters.typeIds.includes(item.typeId)) return false;

    const itemStart = startOfDay(parseISO(item.startDate));
    const itemEnd = item.endDate ? startOfDay(parseISO(item.endDate)) : itemStart;

    // Check direct date match (including multi-day)
    if (target >= itemStart && target <= itemEnd) return true;

    // Check recurrence
    if (item.recurrence && recurringFallsOnDate(item, target)) return true;

    return false;
  });
}
