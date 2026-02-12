import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday

  // Mon-Fri individual, Sat+Sun share last column
  const columns = [];
  for (let i = 0; i < 5; i++) {
    columns.push({ days: [addDays(weekStart, i)] });
  }
  columns.push({ days: [addDays(weekStart, 5), addDays(weekStart, 6)] }); // Sat + Sun

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-6 gap-0 h-full">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className={cn('border-r last:border-r-0 flex flex-col', colIdx === 5 && 'divide-y')}>
            {col.days.map((day, dayIdx) => {
              const dayItems = getItemsForDate(items, day, filters);
              const dayKey = colIdx * 10 + dayIdx;
              const today = isToday(day);

              return (
                <div
                  key={dayIdx}
                  className={cn('flex-1 p-2 md:p-3', col.days.length > 1 && 'min-h-[200px]')}
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
                        today && 'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm'
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    {hoveredDay === dayKey && (
                      <button
                        onClick={() => onAddItem(format(day, 'yyyy-MM-dd'))}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayItems.map(item => {
                      const area = areas.find(a => a.id === item.areaId);
                      return (
                        <div
                          key={item.id}
                          onClick={() => onItemClick(item)}
                          className={cn(
                            'cursor-pointer rounded-lg px-2 py-1.5 text-xs transition-all hover:shadow-sm',
                            item.status === 'done' && 'opacity-50'
                          )}
                          style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
                        >
                          <div className="flex items-center gap-1.5">
                            {area && (
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: `hsl(${area.color})` }} />
                            )}
                            <span className={cn('truncate font-medium', item.status === 'done' && 'line-through')}>
                              {item.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
