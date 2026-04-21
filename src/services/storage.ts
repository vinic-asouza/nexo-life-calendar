import { Area, CalendarItem, ItemType, DEFAULT_AREAS, DEFAULT_TYPES, RecurrenceType } from '@/types';

const KEYS = {
  areas: 'nexo_areas',
  types: 'nexo_types',
  items: 'nexo_items',
} as const;

const STORAGE_SCHEMA_VERSION = 1;
const RECURRENCE_TYPES = new Set<RecurrenceType>(['daily', 'weekly', 'monthly', 'weekdays', 'custom']);

type StorageEnvelope<T> = {
  version: number;
  data: T;
};

function isEnvelope<T>(value: unknown): value is StorageEnvelope<T> {
  return typeof value === 'object' && value !== null && 'version' in value && 'data' in value;
}

function normalizeItems(value: unknown): CalendarItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => {
      const recurrenceType = typeof item.recurrence === 'object' && item.recurrence !== null && typeof item.recurrence.type === 'string'
        ? item.recurrence.type
        : undefined;

      const recurrence = recurrenceType && RECURRENCE_TYPES.has(recurrenceType as RecurrenceType)
        ? {
            type: recurrenceType as RecurrenceType,
            customDays: Array.isArray(item.recurrence.customDays)
              ? item.recurrence.customDays.filter((day): day is number => typeof day === 'number')
              : undefined,
            endDate: typeof item.recurrence.endDate === 'string' ? item.recurrence.endDate : undefined,
          }
        : undefined;

      return {
        id: typeof item.id === 'string' ? item.id : `item-migrated-${index}`,
        title: typeof item.title === 'string' ? item.title : '',
        startDate: typeof item.startDate === 'string' ? item.startDate : '',
        endDate: typeof item.endDate === 'string' ? item.endDate : undefined,
        areaId: typeof item.areaId === 'string' ? item.areaId : '',
        typeId: typeof item.typeId === 'string' ? item.typeId : '',
        recurrence,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
        status: item.status === 'done' ? 'done' : 'pending',
        completedDates: Array.isArray(item.completedDates)
          ? item.completedDates.filter((date): date is string => typeof date === 'string')
          : undefined,
        checklist: Array.isArray(item.checklist)
          ? item.checklist.filter((entry): entry is CalendarItem['checklist'][number] => (
              typeof entry === 'object' &&
              entry !== null &&
              typeof entry.id === 'string' &&
              typeof entry.text === 'string' &&
              typeof entry.done === 'boolean'
            ))
          : undefined,
        comments: Array.isArray(item.comments)
          ? item.comments.filter((entry): entry is CalendarItem['comments'][number] => (
              typeof entry === 'object' &&
              entry !== null &&
              typeof entry.id === 'string' &&
              typeof entry.text === 'string' &&
              typeof entry.createdAt === 'string'
            ))
          : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      };
    });
}

function getVersioned<T>(key: string, fallback: T, migrate: (value: unknown, version: number) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const version = isEnvelope<T>(parsed) ? parsed.version : 0;
    const source = isEnvelope<T>(parsed) ? parsed.data : parsed;
    const migrated = migrate(source, version);

    if (!isEnvelope<T>(parsed) || parsed.version !== STORAGE_SCHEMA_VERSION) {
      set(key, migrated);
    }

    return migrated;
  } catch {
    return fallback;
  }
}

function get<T>(key: string, fallback: T): T {
  return getVersioned(key, fallback, (value) => value as T);
}

function set<T>(key: string, value: T): void {
  const payload: StorageEnvelope<T> = { version: STORAGE_SCHEMA_VERSION, data: value };
  localStorage.setItem(key, JSON.stringify(payload));
}

// Areas
export const getAreas = (): Area[] => get(KEYS.areas, DEFAULT_AREAS);
export const saveAreas = (areas: Area[]): void => set(KEYS.areas, areas);

// Types
export const getTypes = (): ItemType[] => get(KEYS.types, DEFAULT_TYPES);
export const saveTypes = (types: ItemType[]): void => set(KEYS.types, types);

// Items
export const getItems = (): CalendarItem[] => getVersioned(KEYS.items, [], normalizeItems);
export const saveItems = (items: CalendarItem[]): void => set(KEYS.items, items);
