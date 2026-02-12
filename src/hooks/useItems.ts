import { useState, useCallback, useMemo } from 'react';
import { CalendarItem, FilterState, Recurrence } from '@/types';
import { getItems, saveItems } from '@/services/storage';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, getDay } from 'date-fns';

export function useItems() {
  const [items, setItems] = useState<CalendarItem[]>(getItems);

  const persist = useCallback((next: CalendarItem[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  const addItem = useCallback((item: Omit<CalendarItem, 'id' | 'createdAt'>) => {
    const newItem: CalendarItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    persist([...getItems(), newItem]);
    return newItem;
  }, [persist]);

  const updateItem = useCallback((id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>) => {
    persist(getItems().map(i => i.id === id ? { ...i, ...updates } : i));
  }, [persist]);

  const deleteItem = useCallback((id: string) => {
    persist(getItems().filter(i => i.id !== id));
  }, [persist]);

  const toggleStatus = useCallback((id: string) => {
    persist(getItems().map(i =>
      i.id === id ? { ...i, status: i.status === 'done' ? 'pending' as const : 'done' as const } : i
    ));
  }, [persist]);

  return { items, addItem, updateItem, deleteItem, toggleStatus };
}

// Check if a recurring item falls on a specific date
function recurringFallsOnDate(item: CalendarItem, date: Date): boolean {
  if (!item.recurrence) return false;
  const itemStart = startOfDay(parseISO(item.startDate));
  if (date < itemStart) return false;

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
    // Filter by area and type
    if (filters.areaIds.length > 0 && !filters.areaIds.includes(item.areaId)) return false;
    if (filters.typeIds.length > 0 && !filters.typeIds.includes(item.typeId)) return false;

    const itemStart = startOfDay(parseISO(item.startDate));
    const itemEnd = item.endDate ? startOfDay(parseISO(item.endDate)) : itemStart;

    // Check direct date match (including multi-day)
    if (target >= itemStart && target <= itemEnd) return true;

    // Check recurrence
    if (item.recurrence && recurringFallsOnDate(item, target)) return true;

    return false;
  });
}
