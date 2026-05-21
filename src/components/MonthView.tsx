import { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarItem, Area, ItemType, FilterState, GroupingMode } from '@/types';
import { getItemsForDate, isItemDoneOnDate } from '@/hooks/useItems';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
} from 'date-fns';
import { Plus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarData } from '@/context/CalendarDataContext';
import { sortItemsChronologically } from '@/lib/itemSort';
import { DayDetailModal } from '@/components/DayDetailModal';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DayCellDotsProps {
  dayItems: CalendarItem[];
  areas: Area[];
  types: ItemType[];
  dateStr: string;
  maxDots: number;
  grouping: GroupingMode;
}

function DayCellDots({ dayItems, areas, types, dateStr, maxDots, grouping }: DayCellDotsProps) {
  const allDots = useMemo(() => {
    if (grouping === 'time') {
      const sorted = sortItemsChronologically(dayItems);
      return sorted.map(item => {
        const area = areas.find(a => a.id === item.areaId);
        const done = isItemDoneOnDate(item, dateStr);
        return {
          id: item.id,
          color: area
            ? `hsl(${area.color} / ${done ? 0.3 : 0.8})`
            : `hsl(var(--muted-foreground) / ${done ? 0.2 : 0.5})`,
        };
      });
    }
    const areaGroups = new Map<string, { area: Area | undefined; items: CalendarItem[] }>();
    dayItems.forEach(item => {
      const group = areaGroups.get(item.areaId);
      if (group) group.items.push(item);
      else areaGroups.set(item.areaId, { area: areas.find(a => a.id === item.areaId), items: [item] });
    });
    const sorted = [...areaGroups.values()].sort((a, b) => {
      const ai = areas.findIndex(ar => ar.id === a.area?.id);
      const bi = areas.findIndex(ar => ar.id === b.area?.id);
      return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
    });
    return sorted.flatMap(group => {
      const sortedItems = [...group.items].sort((a, b) => {
        const ai = types.findIndex(t => t.id === a.typeId);
        const bi = types.findIndex(t => t.id === b.typeId);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
      return sortedItems.map(item => {
        const done = isItemDoneOnDate(item, dateStr);
        return {
          id: item.id,
          color: group.area
            ? `hsl(${group.area.color} / ${done ? 0.3 : 0.8})`
            : `hsl(var(--muted-foreground) / ${done ? 0.2 : 0.5})`,
        };
      });
    });
  }, [dayItems, areas, types, dateStr, grouping]);

  const hasOverflow = allDots.length > maxDots;
  const visibleCount = hasOverflow ? maxDots - 1 : allDots.length;

  return (
    <div data-day-cell-dots className="mt-1.5 flex-1 overflow-hidden">
      <div className="flex items-start content-start gap-[3px] flex-wrap h-full">
        {allDots.slice(0, visibleCount).map(dot => (
          <span
            key={dot.id}
            className="block h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: dot.color }}
          />
        ))}
        {hasOverflow && (
          <span className="flex h-3 w-3 items-center justify-center rounded-full shrink-0 bg-muted-foreground/30">
            <Plus className="h-2 w-2 text-muted-foreground" />
          </span>
        )}
      </div>
    </div>
  );
}

interface MonthViewProps {
  date: Date;
  filters: FilterState;
  grouping: GroupingMode;
  onItemClick: (item: CalendarItem, occurrenceDate?: string) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}

export function MonthView({ date, filters, grouping, onItemClick, onAddItem, onToggleStatus }: MonthViewProps) {
  const { items, areas, types } = useCalendarData();
  const [viewDayModal, setViewDayModal] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [maxDots, setMaxDots] = useState(20);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const numWeeks = days.length / 7;

  const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  useEffect(() => {
    const updateMaxDots = () => {
      const sampleCell = gridRef.current?.querySelector<HTMLElement>('[data-day-cell-dots]');
      if (!sampleCell) return;

      const dotSize = 12;
      const gap = 3;
      const width = sampleCell.clientWidth;
      const height = sampleCell.clientHeight;
      const dotsPerRow = Math.max(1, Math.floor((width + gap) / (dotSize + gap)));
      const rows = Math.max(1, Math.floor((height + gap) / (dotSize + gap)));
      setMaxDots(dotsPerRow * rows);
    };

    updateMaxDots();

    const observer = new ResizeObserver(updateMaxDots);
    if (gridRef.current) observer.observe(gridRef.current);

    return () => observer.disconnect();
  }, [numWeeks]);

  const itemsByDate = useMemo(() => {
    const cache = new Map<string, CalendarItem[]>();
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      cache.set(dateStr, getItemsForDate(items, day, filters));
    }
    return cache;
  }, [days, items, filters]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div ref={gridRef} className="grid grid-cols-7 gap-px bg-border flex-1" style={{ gridTemplateRows: `auto repeat(${numWeeks}, 1fr)` }}>
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="bg-muted/50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, date);
          const today = isToday(day);
          const dayItems = itemsByDate.get(key) ?? [];
          const MAX_VISIBLE = 5;

          return (
            <div
              key={key}
              className={cn(
                'relative bg-card p-1.5 md:p-2 overflow-hidden flex flex-col',
                !inMonth && 'bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs font-medium',
                  !inMonth && 'text-muted-foreground/40',
                  today && 'flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px]'
                )}>
                  {format(day, 'd')}
                </span>
                {inMonth && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setViewDayModal(key)}
                      className="flex h-5 w-5 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onAddItem(key)}
                      className="flex h-5 w-5 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <DayCellDots dayItems={dayItems} areas={areas} types={types} dateStr={key} maxDots={maxDots} grouping={grouping} />
            </div>
          );
        })}
      </div>

      {viewDayModal && (
        <DayDetailModal
          date={viewDayModal}
          filters={filters}
          grouping={grouping}
          onClose={() => setViewDayModal(null)}
          onItemClick={onItemClick}
          onAddItem={onAddItem}
          onToggleStatus={onToggleStatus}
        />
      )}
    </div>
  );
}
