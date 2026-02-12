import { CalendarItem, Area, ItemType, FilterState } from '@/types';
import { getItemsForDate } from '@/hooks/useItems';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

      <div className="space-y-2">
        {dayItems.map(item => {
          const area = areas.find(a => a.id === item.areaId);
          const type = types.find(t => t.id === item.typeId);

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
            >
              <button
                onClick={e => { e.stopPropagation(); onToggleStatus(item.id); }}
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  item.status === 'done' ? 'border-primary bg-primary' : 'border-muted-foreground/40 hover:border-primary'
                )}
              >
                {item.status === 'done' && <Check className="h-3 w-3 text-primary-foreground" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', item.status === 'done' && 'line-through text-muted-foreground')}>
                  {item.title}
                </p>
                {item.notes && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {area && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `hsl(${area.color} / 0.12)`, color: `hsl(${area.color})` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(${area.color})` }} />
                    {area.name}
                  </span>
                )}
                {type && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {type.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {dayItems.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">Nenhum item para este dia</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onAddItem(format(date, 'yyyy-MM-dd'))}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Adicionar item
      </button>
    </div>
  );
}
