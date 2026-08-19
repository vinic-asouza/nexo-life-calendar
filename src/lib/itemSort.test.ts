import { describe, expect, it } from 'vitest';
import type { Area, CalendarItem, ItemType } from '@/types';
import { compareByTime, groupItemsByType, sortItemsChronologically } from './itemSort';

const makeItem = (overrides: Partial<CalendarItem>): CalendarItem => ({
  id: overrides.id ?? 'id',
  title: overrides.title ?? 'Item',
  startDate: overrides.startDate ?? '2026-01-01',
  areaId: overrides.areaId ?? 'area-1',
  typeId: overrides.typeId ?? 'type-1',
  status: overrides.status ?? 'pending',
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('compareByTime', () => {
  it('puts timed items before untimed ones', () => {
    const timed = makeItem({ id: 'a', startTime: '09:00' });
    const untimed = makeItem({ id: 'b' });
    expect(compareByTime(timed, untimed)).toBeLessThan(0);
  });
});

describe('sortItemsChronologically', () => {
  it('sorts by time and falls back to title', () => {
    const items = [
      makeItem({ id: '1', title: 'Zebra', startTime: '10:00' }),
      makeItem({ id: '2', title: 'Alpha', startTime: '10:00' }),
      makeItem({ id: '3', title: 'Cedo', startTime: '08:00' }),
      makeItem({ id: '4', title: 'Sem hora' }),
    ];
    expect(sortItemsChronologically(items).map((i) => i.id)).toEqual(['3', '2', '1', '4']);
  });

  it('does not mutate the input array', () => {
    const items = [makeItem({ id: '1', startTime: '12:00' }), makeItem({ id: '2', startTime: '08:00' })];
    sortItemsChronologically(items);
    expect(items.map((i) => i.id)).toEqual(['1', '2']);
  });
});

describe('groupItemsByType', () => {
  const types: ItemType[] = [
    { id: 'type-event', name: 'Evento' },
    { id: 'type-task', name: 'Tarefa' },
  ];
  const areas: Area[] = [
    { id: 'area-1', name: 'Pessoal', color: '217 91% 60%' },
    { id: 'area-2', name: 'Trabalho', color: '37 92% 60%' },
  ];

  it('groups in the configured type order and sorts by time then area order', () => {
    const items = [
      makeItem({ id: 't1', typeId: 'type-task', startTime: '09:00', areaId: 'area-2' }),
      makeItem({ id: 'e1', typeId: 'type-event', startTime: '09:00', areaId: 'area-2' }),
      makeItem({ id: 'e2', typeId: 'type-event', startTime: '09:00', areaId: 'area-1' }),
    ];
    const groups = groupItemsByType(items, types, areas);
    expect(groups.map((g) => g.type?.id)).toEqual(['type-event', 'type-task']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['e2', 'e1']);
  });

  it('keeps items whose type no longer exists in an undefined group', () => {
    const items = [makeItem({ id: 'orphan', typeId: 'type-removed' })];
    const groups = groupItemsByType(items, types, areas);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBeUndefined();
    expect(groups[0].items.map((i) => i.id)).toEqual(['orphan']);
  });
});
