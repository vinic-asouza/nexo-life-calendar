import { CalendarItem, FilterState, GroupingMode } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getItemsForDate, isItemDoneOnDate } from '@/hooks/useItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ListChecks, MessageSquare } from 'lucide-react';
import { CheckIndicator } from '@/components/ui/check-indicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { useCalendarData } from '@/context/CalendarDataContext';
import { formatItemTime, groupItemsByType, sortItemsChronologically } from '@/lib/itemSort';
import { DayJournal } from '@/components/DayJournal';

interface DayViewProps {
  date: Date;
  filters: FilterState;
  grouping: GroupingMode;
  onItemClick: (item: CalendarItem, occurrenceDate?: string) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}

function ItemRow({
  item, area, dateStr, onItemClick, onToggleStatus,
}: {
  item: CalendarItem;
  area: { id: string; name: string; color: string } | undefined;
  dateStr: string;
  onItemClick: (item: CalendarItem, occurrenceDate?: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}) {
  const isDone = isItemDoneOnDate(item, dateStr);
  const time = formatItemTime(item);
  return (
    <div
      onClick={() => onItemClick(item, dateStr)}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        isDone && 'opacity-60'
      )}
      style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
      onMouseEnter={e => { if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.25)`; }}
      onMouseLeave={e => { if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.1)`; }}
    >
      <CheckIndicator
        size="md"
        done={isDone}
        color={area?.color}
        onClick={e => { e.stopPropagation(); onToggleStatus(item.id, dateStr); }}
      />
      <span className="text-xs tabular-nums text-muted-foreground w-20 shrink-0">
        {time ?? '—'}
      </span>
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
}

export function DayView({ date, filters, grouping, onItemClick, onAddItem, onToggleStatus }: DayViewProps) {
  const { items, areas, types } = useCalendarData();
  const dayItems = getItemsForDate(items, date, filters);
  const dateStr = format(date, 'yyyy-MM-dd');

  const groupedItems = useMemo(
    () => grouping === 'type' ? groupItemsByType(dayItems, types, areas) : [],
    [dayItems, types, areas, grouping]
  );
  const timeSorted = useMemo(
    () => grouping === 'time' ? sortItemsChronologically(dayItems) : [],
    [dayItems, grouping]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2 md:px-8 md:pt-8 md:pb-4">
        <p className="text-sm font-medium text-muted-foreground capitalize">
          {format(date, 'EEEE', { locale: ptBR })}
        </p>
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {format(date, "d 'de' MMMM", { locale: ptBR })}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4 md:px-8 md:pb-8 space-y-6">
          {grouping === 'type' && groupedItems.map(group => (
            <div key={group.type?.id || 'unknown'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.type?.name || 'Sem tipo'}
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    area={areas.find(a => a.id === item.areaId)}
                    dateStr={dateStr}
                    onItemClick={onItemClick}
                    onToggleStatus={onToggleStatus}
                  />
                ))}
              </div>
            </div>
          ))}

          {grouping === 'time' && (
            <div className="space-y-1">
              {timeSorted.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  area={areas.find(a => a.id === item.areaId)}
                  dateStr={dateStr}
                  onItemClick={onItemClick}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </div>
          )}

          {dayItems.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Nenhum item para este dia</p>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Button onClick={() => onAddItem(format(date, 'yyyy-MM-dd'))} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
