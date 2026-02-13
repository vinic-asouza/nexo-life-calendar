import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface DayViewProps {
  date: Date;
  items: CalendarItem[];
  areas: Area[];
  types: ItemType[];
  filters: FilterState;
  onItemClick: (item: CalendarItem) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string) => void;
}

export function DayView({ date, items, areas, types, filters, onItemClick, onAddItem, onToggleStatus }: DayViewProps) {
  const dayItems = getItemsForDate(items, date, filters);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: { type: ItemType | undefined; items: CalendarItem[] }[] = [];
    const typeMap = new Map<string, CalendarItem[]>();

    dayItems.forEach(item => {
      const existing = typeMap.get(item.typeId);
      if (existing) {
        existing.push(item);
      } else {
        typeMap.set(item.typeId, [item]);
      }
    });

    typeMap.forEach((items, typeId) => {
      groups.push({ type: types.find(t => t.id === typeId), items });
    });

    return groups;
  }, [dayItems, types]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground capitalize">
          {format(date, 'EEEE', { locale: ptBR })}
        </p>
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {format(date, "d 'de' MMMM", { locale: ptBR })}
        </h2>
      </div>

      <div className="space-y-1">
        {groupedItems.map(group => (
          group.items.map(item => {
            const area = areas.find(a => a.id === item.areaId);
            const type = types.find(t => t.id === item.typeId);
            const isDone = item.status === 'done';

            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className={cn(
                  'group flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                  isDone ? 'bg-muted/40 border-border/50' : 'bg-card hover:bg-muted/50 border-border'
                )}
              >
                <button
                  onClick={e => { e.stopPropagation(); onToggleStatus(item.id); }}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                    isDone ? 'border-primary bg-primary' : 'border-muted-foreground/40 hover:border-primary'
                  )}
                >
                  {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-sm', isDone && 'text-muted-foreground')}>
                    {item.title}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {area && (
                    <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium"
                      style={{ backgroundColor: `hsl(${area.color} / 0.12)`, color: `hsl(${area.color})` }}>
                      {area.name}
                    </span>
                  )}
                  {type && (
                    <span className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {type.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ))}

        {dayItems.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">Nenhum item para este dia</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => onAddItem(format(date, 'yyyy-MM-dd'))}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </Button>
      </div>
    </div>
  );
}
