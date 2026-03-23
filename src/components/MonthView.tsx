import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Eye, X, Check, ListChecks, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DayCellDotsProps {
  dayItems: CalendarItem[];
  areas: Area[];
  types: ItemType[];
}

function DayCellDots({ dayItems, areas, types }: DayCellDotsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDots, setMaxDots] = useState(20);

  const updateMax = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dotSize = 12; // h-3 = 0.75rem = 12px
    const gap = 3;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const dotsPerRow = Math.max(1, Math.floor((w + gap) / (dotSize + gap)));
    const rows = Math.max(1, Math.floor((h + gap) / (dotSize + gap)));
    setMaxDots(dotsPerRow * rows);
  }, []);

  useEffect(() => {
    updateMax();
    const observer = new ResizeObserver(updateMax);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateMax]);

  // Flatten all items sorted by area then type
  const allDots = useMemo(() => {
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
      return sortedItems.map(item => ({
        id: item.id,
        color: group.area
          ? `hsl(${group.area.color} / ${item.status === 'done' ? 0.3 : 0.8})`
          : `hsl(var(--muted-foreground) / ${item.status === 'done' ? 0.2 : 0.5})`,
      }));
    });
  }, [dayItems, areas, types]);

  const hasOverflow = allDots.length > maxDots;
  const visibleCount = hasOverflow ? maxDots - 1 : allDots.length;

  return (
    <div ref={containerRef} className="mt-1.5 flex-1 overflow-hidden">
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
  items: CalendarItem[];
  areas: Area[];
  types: ItemType[];
  filters: FilterState;
  onItemClick: (item: CalendarItem) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string) => void;
}

export function MonthView({ date, items, areas, types, filters, onItemClick, onAddItem, onToggleStatus }: MonthViewProps) {
  const [viewDayModal, setViewDayModal] = useState<string | null>(null);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const numWeeks = days.length / 7;

  const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const viewDayItems = viewDayModal ? getItemsForDate(items, parseLocalDate(viewDayModal), filters) : [];

  const viewDayGrouped = useMemo(() => {
    if (!viewDayModal) return [];
    const groups: { type: ItemType | undefined; items: CalendarItem[] }[] = [];
    const typeMap = new Map<string, CalendarItem[]>();
    viewDayItems.forEach(item => {
      const existing = typeMap.get(item.typeId);
      if (existing) existing.push(item);
      else typeMap.set(item.typeId, [item]);
    });
    types.forEach(t => {
      const items = typeMap.get(t.id);
      if (items) {
        items.sort((a, b) => {
          const ai = areas.findIndex(ar => ar.id === a.areaId);
          const bi = areas.findIndex(ar => ar.id === b.areaId);
          return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
        });
        groups.push({ type: t, items });
      }
    });
    typeMap.forEach((items, typeId) => {
      if (!types.find(t => t.id === typeId)) groups.push({ type: undefined, items });
    });
    return groups;
  }, [viewDayItems, types, viewDayModal]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className="grid grid-cols-7 gap-px bg-border flex-1" style={{ gridTemplateRows: `auto repeat(${numWeeks}, 1fr)` }}>
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="bg-muted/50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, date);
          const today = isToday(day);
          const dayItems = getItemsForDate(items, day, filters);
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

              <DayCellDots dayItems={dayItems} areas={areas} types={types} />
            </div>
          );
        })}
      </div>

      {/* Day view modal */}
      {viewDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setViewDayModal(null)}>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-xl bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base capitalize" style={{ fontFamily: 'var(--font-display)' }}>
                {format(parseLocalDate(viewDayModal), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <button onClick={() => setViewDayModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {viewDayGrouped.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item neste dia</p>
              )}
              {viewDayGrouped.map(group => (
                <div key={group.type?.id || 'unknown'}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.type?.name || 'Sem tipo'}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-1">
                    {group.items.map(item => {
                      const area = areas.find(a => a.id === item.areaId);
                      const isDone = item.status === 'done';
                      return (
                        <div
                          key={item.id}
                          onClick={() => { setViewDayModal(null); onItemClick(item); }}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                            isDone && 'opacity-60'
                          )}
                          style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
                          onMouseEnter={e => {
                            if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.25)`;
                          }}
                          onMouseLeave={e => {
                            if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.1)`;
                          }}
                        >
                          <button
                            onClick={e => { e.stopPropagation(); onToggleStatus(item.id); }}
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                              isDone
                                ? 'border-transparent'
                                : 'border-muted-foreground/40 hover:border-primary'
                            )}
                            style={isDone && area ? { backgroundColor: `hsl(${area.color})`, borderColor: `hsl(${area.color})` } : undefined}
                          >
                            {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium text-sm', isDone && 'text-muted-foreground')}>
                              {item.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.checklist && item.checklist.length > 0 && (
                              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {item.comments && item.comments.length > 0 && (
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {area && (
                              <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium"
                                style={{ backgroundColor: `hsl(${area.color} / 0.15)`, color: `hsl(${area.color})` }}>
                                {area.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-center">
              <Button size="sm" className="gap-1.5" onClick={() => { setViewDayModal(null); onAddItem(viewDayModal); }}>
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
