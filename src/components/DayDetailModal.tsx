import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, ListChecks, MessageSquare, BookText, Loader2, Check } from 'lucide-react';
import { CalendarItem, GroupingMode } from '@/types';
import { getItemsForDate, isItemDoneOnDate } from '@/hooks/useItems';
import { useCalendarData } from '@/context/CalendarDataContext';
import { formatItemTime, groupItemsByType, sortItemsChronologically } from '@/lib/itemSort';
import { useJournal } from '@/hooks/useJournal';
import { CheckIndicator } from '@/components/ui/check-indicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterState } from '@/types';
import { cn } from '@/lib/utils';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DayDetailModalProps {
  date: string; // YYYY-MM-DD
  filters: FilterState;
  grouping: GroupingMode;
  onClose: () => void;
  onItemClick: (item: CalendarItem, occurrenceDate?: string) => void;
  onAddItem: (date: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}

export function DayDetailModal({
  date,
  filters,
  grouping,
  onClose,
  onItemClick,
  onAddItem,
  onToggleStatus,
}: DayDetailModalProps) {
  const { items, areas, types } = useCalendarData();
  const { content, loading, saveState, updateContent } = useJournal(date);

  const dayItems = useMemo(
    () => getItemsForDate(items, parseLocalDate(date), filters),
    [items, date, filters]
  );

  const grouped = useMemo(
    () => (grouping === 'type' ? groupItemsByType(dayItems, types, areas) : []),
    [dayItems, types, areas, grouping]
  );
  const timeSorted = useMemo(
    () => (grouping === 'time' ? sortItemsChronologically(dayItems) : []),
    [dayItems, grouping]
  );

  const renderItem = (item: CalendarItem) => {
    const area = areas.find((a) => a.id === item.areaId);
    const isDone = isItemDoneOnDate(item, date);
    const time = formatItemTime(item);
    return (
      <div
        key={item.id}
        onClick={() => {
          onClose();
          onItemClick(item, date);
        }}
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
          isDone && 'opacity-60'
        )}
        style={{ backgroundColor: area ? `hsl(${area.color} / 0.1)` : undefined }}
        onMouseEnter={(e) => {
          if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.25)`;
        }}
        onMouseLeave={(e) => {
          if (area) (e.currentTarget as HTMLElement).style.backgroundColor = `hsl(${area.color} / 0.1)`;
        }}
      >
        <CheckIndicator
          size="md"
          done={isDone}
          color={area?.color}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(item.id, date);
          }}
        />
        <span className="text-xs tabular-nums text-muted-foreground w-20 shrink-0">{time ?? '—'}</span>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-sm', isDone && 'text-muted-foreground')}>{item.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.checklist && item.checklist.length > 0 && (
            <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {item.comments && item.comments.length > 0 && (
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {area && (
            <span
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: `hsl(${area.color} / 0.15)`, color: `hsl(${area.color})` }}
            >
              {area.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm dark:bg-overlay/75" />
      <div
        className="relative z-10 w-full max-w-4xl rounded-lg bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base capitalize" style={{ fontFamily: 'var(--font-display)' }}>
            {format(parseLocalDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
          {/* Items column */}
          <div className="flex flex-col min-w-0">
            <ScrollArea className="max-h-[55vh] pr-2">
              <div className="space-y-4">
                {dayItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item neste dia</p>
                )}

                {grouping === 'time' ? (
                  <div className="space-y-1">{timeSorted.map(renderItem)}</div>
                ) : (
                  grouped.map((group) => (
                    <div key={group.type?.id || 'unknown'}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.type?.name || 'Sem tipo'}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="space-y-1">{group.items.map(renderItem)}</div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="mt-3 flex justify-center">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onClose();
                  onAddItem(date);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>
          </div>

          {/* Journal column */}
          <div className="flex flex-col min-w-0 md:border-l md:border-border/50 md:pl-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Diário</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {saveState === 'saving' && (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" /> Salvo
                  </span>
                )}
              </div>
            </div>
            <Textarea
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder={loading ? 'Carregando…' : 'Escreva livremente sobre o seu dia…'}
              disabled={loading}
              className="min-h-[280px] md:min-h-[55vh] resize-none bg-background/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
