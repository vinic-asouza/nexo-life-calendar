import { CalendarItem, FilterState, GroupingMode } from '@/types';
import { getItemsForDate, isItemDoneOnDate } from '@/hooks/useItems';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Eye, ListChecks, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCalendarData } from '@/context/CalendarDataContext';
import { formatItemTime, groupItemsByType, sortItemsChronologically } from '@/lib/itemSort';
import { DayDetailModal } from '@/components/DayDetailModal';

interface WeekViewProps {
  date: Date;
  filters: FilterState;
  grouping: GroupingMode;
  onItemClick: (item: CalendarItem, occurrenceDate?: string) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}

export function WeekView({ date, filters, grouping, onItemClick, onAddItem, onToggleStatus }: WeekViewProps) {
  const { items, areas, types } = useCalendarData();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [viewDayModal, setViewDayModal] = useState<string | null>(null);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });

  const columns = useMemo(() => {
    const cols = [];
    for (let i = 0; i < 5; i++) cols.push({ days: [addDays(weekStart, i)] });
    cols.push({ days: [addDays(weekStart, 5), addDays(weekStart, 6)] });
    return cols;
  }, [weekStart.getTime()]);

  const renderItem = (item: CalendarItem, dayStr: string) => {
    const area = areas.find(a => a.id === item.areaId);
    const isDone = isItemDoneOnDate(item, dayStr);
    const time = formatItemTime(item);
    return (
      <div
        key={item.id}
        onClick={() => onItemClick(item, dayStr)}
        className={cn(
          'cursor-pointer rounded-lg px-2 py-1.5 text-xs transition-colors',
          isDone && 'opacity-50'
        )}
        style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
        onMouseEnter={e => { if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.25)`; }}
        onMouseLeave={e => { if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.1)`; }}
      >
        <div className="flex items-center gap-1">
          {time && (
            <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">{time}</span>
          )}
          <span className="truncate font-medium flex-1">{item.title}</span>
          {item.checklist && item.checklist.length > 0 && (
            <ListChecks className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {item.comments && item.comments.length > 0 && (
            <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-x-auto h-full">
      <div className="grid min-w-[700px] grid-cols-6 gap-0 h-full">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className={cn('border-r last:border-r-0 flex flex-col min-h-0', colIdx === 5 && 'divide-y divide-border')}>
            {col.days.map((day, dayIdx) => {
              const dayItems = getItemsForDate(items, day, filters);
              const dayKey = colIdx * 10 + dayIdx;
              const today = isToday(day);
              const dayStr = format(day, 'yyyy-MM-dd');
              const grouped = grouping === 'type' ? groupItemsByType(dayItems, types, areas) : [];
              const sorted = grouping === 'time' ? sortItemsChronologically(dayItems) : [];

              return (
                <div
                  key={dayIdx}
                  className={cn('flex-1 p-2 md:p-3 min-h-0 flex flex-col overflow-hidden')}
                  onMouseEnter={() => setHoveredDay(dayKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="shrink-0 mb-2 flex items-center justify-between">
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewDayModal(dayStr)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Ver detalhes do dia"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      {hoveredDay === dayKey && (
                        <button
                          onClick={() => onAddItem(dayStr)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    {grouping === 'type' ? (
                      <div className="space-y-4">
                        {grouped.map(group => (
                          <div key={group.type?.id || 'unknown'}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                {group.type?.name || 'Sem tipo'}
                              </span>
                              <Separator className="flex-1" />
                            </div>
                            <div className="space-y-0.5">
                              {group.items.map(item => renderItem(item, dayStr))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {sorted.map(item => renderItem(item, dayStr))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        ))}
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
