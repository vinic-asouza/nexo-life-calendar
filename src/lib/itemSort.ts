import { CalendarItem, ItemType, Area } from '@/types';

export function formatItemTime(item: CalendarItem): string | null {
  if (!item.startTime) return null;
  return item.startTime;
}

const timeKey = (t?: string) => (t ? t : '99:99');

export function compareByTime(a: CalendarItem, b: CalendarItem): number {
  return timeKey(a.startTime).localeCompare(timeKey(b.startTime));
}

export function sortItemsChronologically(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    const t = compareByTime(a, b);
    if (t !== 0) return t;
    return a.title.localeCompare(b.title);
  });
}

export function groupItemsByType(
  items: CalendarItem[],
  types: ItemType[],
  areas: Area[],
): { type: ItemType | undefined; items: CalendarItem[] }[] {
  const groups: { type: ItemType | undefined; items: CalendarItem[] }[] = [];
  const typeMap = new Map<string, CalendarItem[]>();
  items.forEach((item) => {
    const arr = typeMap.get(item.typeId) ?? [];
    arr.push(item);
    typeMap.set(item.typeId, arr);
  });
  types.forEach((t) => {
    const list = typeMap.get(t.id);
    if (list) {
      list.sort((a, b) => {
        const tc = compareByTime(a, b);
        if (tc !== 0) return tc;
        const ai = areas.findIndex((ar) => ar.id === a.areaId);
        const bi = areas.findIndex((ar) => ar.id === b.areaId);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
      groups.push({ type: t, items: list });
    }
  });
  typeMap.forEach((list, typeId) => {
    if (!types.find((t) => t.id === typeId)) {
      groups.push({ type: undefined, items: sortItemsChronologically(list) });
    }
  });
  return groups;
}
