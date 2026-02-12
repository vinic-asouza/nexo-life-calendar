import { Area, CalendarItem, ItemType, DEFAULT_AREAS, DEFAULT_TYPES } from '@/types';

const KEYS = {
  areas: 'nexo_areas',
  types: 'nexo_types',
  items: 'nexo_items',
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Areas
export const getAreas = (): Area[] => get(KEYS.areas, DEFAULT_AREAS);
export const saveAreas = (areas: Area[]): void => set(KEYS.areas, areas);

// Types
export const getTypes = (): ItemType[] => get(KEYS.types, DEFAULT_TYPES);
export const saveTypes = (types: ItemType[]): void => set(KEYS.types, types);

// Items
export const getItems = (): CalendarItem[] => get(KEYS.items, []);
export const saveItems = (items: CalendarItem[]): void => set(KEYS.items, items);
