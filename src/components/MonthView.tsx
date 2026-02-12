import { CalendarItem, Area, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MonthViewProps {
  date: Date;
  items: CalendarItem[];
  areas: Area[];
  filters: FilterState;
  onItemClick: (item: CalendarItem) => void;
  onAddItem: (date: string) => void;
}

export function MonthView({ date, items, areas, filters, onItemClick, onAddItem }: MonthViewProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="flex-1 p-2 md:p-4">
      <div className="grid grid-cols-7 gap-px rounded-xl bg-border overflow-hidden">
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
          const MAX_VISIBLE = 3;

          return (
            <div
              key={key}
              className={cn(
                'relative min-h-[80px] bg-card p-1.5 md:min-h-[100px] md:p-2 transition-colors',
                !inMonth && 'bg-muted/30'
              )}
              onMouseEnter={() => setHoveredDay(key)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs font-medium',
                  !inMonth && 'text-muted-foreground/40',
                  today && 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]'
                )}>
                  {format(day, 'd')}
                </span>
                {hoveredDay === key && inMonth && (
                  <button
                    onClick={() => onAddItem(key)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, MAX_VISIBLE).map(item => {
                  const area = areas.find(a => a.id === item.areaId);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className={cn(
                        'cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-all hover:shadow-sm',
                        item.status === 'done' && 'opacity-50 line-through'
                      )}
                      style={{
                        backgroundColor: area ? `hsl(${area.color} / 0.15)` : 'hsl(var(--muted))',
                        color: area ? `hsl(${area.color})` : undefined,
                      }}
                    >
                      {item.title}
                    </div>
                  );
                })}
                {dayItems.length > MAX_VISIBLE && (
                  <p className="px-1 text-[9px] text-muted-foreground">+{dayItems.length - MAX_VISIBLE} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
