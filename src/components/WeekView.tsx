import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

interface WeekViewProps {
  date: Date;
  items: CalendarItem[];
  areas: Area[];
  types: ItemType[];
  filters: FilterState;
  onItemClick: (item: CalendarItem) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string) => void;
}

export function WeekView({ date, items, areas, types, filters, onItemClick, onAddItem, onToggleStatus }: WeekViewProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });

  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < 5; i++) {
      cols.push({ days: [addDays(weekStart, i)] });
    }
    cols.push({ days: [addDays(weekStart, 5), addDays(weekStart, 6)] });
    return cols;
  }, [weekStart.getTime()]);

  const groupByType = (dayItems: CalendarItem[]) => {
    const groups: { typeId: string; typeName: string; items: CalendarItem[] }[] = [];
    const map = new Map<string, CalendarItem[]>();
    dayItems.forEach(item => {
      const arr = map.get(item.typeId) || [];
      arr.push(item);
      map.set(item.typeId, arr);
    });
    map.forEach((items, typeId) => {
      const type = types.find(t => t.id === typeId);
      groups.push({ typeId, typeName: type?.name || 'Sem tipo', items });
    });
    return groups;
  };

  return (
    <div className="flex-1 flex flex-col overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-6 gap-0 flex-1">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className={cn('border-r last:border-r-0 flex flex-col', colIdx === 5 && 'divide-y divide-border')}>
            {col.days.map((day, dayIdx) => {
              const dayItems = getItemsForDate(items, day, filters);
              const dayKey = colIdx * 10 + dayIdx;
              const today = isToday(day);
              const grouped = groupByType(dayItems);

              return (
                <div
                  key={dayIdx}
                  className={cn('flex-1 p-2 md:p-3 min-h-0 flex flex-col')}
                  onMouseEnter={() => setHoveredDay(dayKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        {format(day, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={cn(
                        'text-lg font-semibold',
                        today && 'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm'
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    {hoveredDay === dayKey && (
                      <button
                        onClick={() => onAddItem(format(day, 'yyyy-MM-dd'))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    {grouped.map(group => (
                      <div key={group.typeId}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                            {group.typeName}
                          </span>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map(item => {
                            const area = areas.find(a => a.id === item.areaId);
                            return (
                              <div
                                key={item.id}
                                onClick={() => onItemClick(item)}
                                className={cn(
                                  'cursor-pointer rounded-lg px-2 py-1.5 text-xs transition-colors',
                                  item.status === 'done' && 'opacity-50'
                                )}
                                style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
                                onMouseEnter={e => {
                                  if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.25)`;
                                }}
                                onMouseLeave={e => {
                                  if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.1)`;
                                }}
                              >
                                <span className={cn('truncate font-medium block', item.status === 'done' && 'line-through')}>
                                  {item.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
