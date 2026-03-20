import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Check, ListChecks, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';

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

    // Follow the order defined in `types` array (sidebar order)
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
    // Items with unknown type
    typeMap.forEach((items, typeId) => {
      if (!types.find(t => t.id === typeId)) groups.push({ type: undefined, items });
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

      <div className="space-y-6">
        {groupedItems.map((group, groupIdx) => (
          <div key={group.type?.id || 'unknown'}>
            {/* Type label and separator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                    onClick={() => onItemClick(item)}
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
