import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { CalendarItem, Area, ItemType, RecurrenceType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
  weekdays: 'Dias Úteis',
  custom: 'Personalizado',
};

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  areas: Area[];
  types: ItemType[];
  initialDate?: string;
  item?: CalendarItem | null;
  mode: 'create' | 'view' | 'edit';
  onSave: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function ItemModal({
  open, onClose, areas, types, initialDate, item, mode: initialMode,
  onSave, onUpdate, onDelete, onToggleStatus,
}: ItemModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [areaId, setAreaId] = useState(areas[0]?.id || '');
  const [typeId, setTypeId] = useState(types[0]?.id || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | ''>('');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      if (item) {
        setTitle(item.title);
        setStartDate(item.startDate.split('T')[0]);
        setEndDate(item.endDate?.split('T')[0] || '');
        setAreaId(item.areaId);
        setTypeId(item.typeId);
        setRecurrenceType(item.recurrence?.type || '');
        setCustomDays(item.recurrence?.customDays || []);
        setNotes(item.notes || '');
        setShowMore(!!(item.recurrence || item.notes || item.endDate));
      } else {
        setTitle('');
        setStartDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
        setEndDate('');
        setAreaId(areas[0]?.id || '');
        setTypeId(types[0]?.id || '');
        setRecurrenceType('');
        setCustomDays([]);
        setNotes('');
        setShowMore(false);
      }
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, item, initialMode, initialDate, areas, types]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      startDate,
      endDate: endDate || undefined,
      areaId,
      typeId,
      recurrence: recurrenceType ? { type: recurrenceType as RecurrenceType, customDays: recurrenceType === 'custom' ? customDays : undefined } : undefined,
      notes: notes || undefined,
      status: item?.status || 'pending' as const,
    };

    if (mode === 'edit' && item) {
      onUpdate(item.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  const area = areas.find(a => a.id === (item?.areaId || areaId));
  const type = types.find(t => t.id === (item?.typeId || typeId));

  const isView = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-t-xl bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 p-6 shadow-xl sm:rounded-xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {mode === 'create' ? 'Novo Item' : mode === 'view' ? 'Detalhes' : 'Editar Item'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isView && item ? (
          /* View mode */
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleStatus(item.id)}
                className={cn(
                  'mt-1 h-5 w-5 rounded-full border-2 transition-colors flex-shrink-0 flex items-center justify-center',
                  item.status === 'done' ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}
              >
                {item.status === 'done' && <span className="text-xs text-primary-foreground">✓</span>}
              </button>
              <h3 className="text-xl font-medium">
                {item.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {area && (
                <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium" style={{ backgroundColor: `hsl(${area.color} / 0.15)`, color: `hsl(${area.color})` }}>
                  {area.name}
                </span>
              )}
              {type && (
                <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {type.name}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{format(new Date(item.startDate), 'dd/MM/yyyy')}{item.endDate ? ` — ${format(new Date(item.endDate), 'dd/MM/yyyy')}` : ''}</p>

            {item.recurrence && (
              <p className="text-sm text-muted-foreground">🔄 {RECURRENCE_LABELS[item.recurrence.type]}</p>
            )}

            {item.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMode('edit')} className="text-xs gap-1.5">
                <Edit2 className="h-3 w-3" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { onDelete(item.id); onClose(); }} className="text-xs gap-1.5">
                <Trash2 className="h-3 w-3" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          /* Create/Edit mode */
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <Input
              ref={titleRef}
              placeholder="O que você precisa organizar?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-lg font-medium placeholder:text-muted-foreground/50"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Área</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50">
                    {areas.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${a.color})` }} />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50">
                  {types.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progressive disclosure */}
            {!showMore ? (
              <button type="button" onClick={() => setShowMore(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" /> Mais opções
              </button>
            ) : (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <Label className="text-xs text-muted-foreground">Data final (opcional)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 h-9 text-sm" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Recorrência</Label>
                  <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as RecurrenceType | '')}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="Sem recorrência" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50">
                      <SelectItem value="none">Sem recorrência</SelectItem>
                      {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceType === 'custom' && (
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                        className={cn(
                          'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                          customDays.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Observações</Label>
                  <Textarea
                    placeholder="Adicione notas..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="mt-1 min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!title.trim()}>
              {mode === 'edit' ? 'Salvar' : 'Criar Item'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
