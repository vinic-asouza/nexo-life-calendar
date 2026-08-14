import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Edit2, Trash2, ListChecks, MessageSquare, Plus, Check, Send, Clock, CalendarIcon, Repeat, FileText } from 'lucide-react';
import { CalendarItem, Area, ItemType, RecurrenceType, ChecklistItem, Comment } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalendarData } from '@/context/CalendarDataContext';

// Parse YYYY-MM-DD as local-time midnight (avoids UTC offset shift).
const parseLocalDate = (dateStr: string) => parseISO(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
import { Separator } from '@/components/ui/separator';
import { CheckIndicator } from '@/components/ui/check-indicator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Generate time options in 15-minute increments
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0');
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  return `${h}:${m}`;
});

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
  initialDate?: string;
  occurrenceDate?: string;
  item?: CalendarItem | null;
  mode: 'create' | 'view' | 'edit';
  calendarViewMode?: 'day' | 'week' | 'month';
  onSave: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string, occurrenceDate?: string) => void;
  onToggleStatus: (id: string, occurrenceDate?: string) => void;
}

export function ItemModal({
  open, onClose, initialDate, occurrenceDate, item, mode: initialMode,
  calendarViewMode,
  onSave, onUpdate, onDelete, onToggleStatus,
}: ItemModalProps) {
  const { areas, types } = useCalendarData();
  const [mode, setMode] = useState(initialMode);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [status, setStatus] = useState<'pending' | 'done'>(item?.status || 'pending');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [areaId, setAreaId] = useState(areas[0]?.id || '');
  const [typeId, setTypeId] = useState(types[0]?.id || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | ''>('');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setMode(initialMode);
    if (item) {
      const isDoneForOcc = item.recurrence && occurrenceDate
        ? (item.completedDates?.includes(occurrenceDate) ?? false)
        : item.status === 'done';
      setStatus(isDoneForOcc ? 'done' : 'pending');
      setTitle(item.title);
      setStartDate(item.startDate.split('T')[0]);
      setEndDate(item.endDate?.split('T')[0] || '');
      setStartTime(item.startTime || '');
      
      setAreaId(item.areaId);
      setTypeId(item.typeId);
      setRecurrenceType(item.recurrence?.type || '');
      setCustomDays(item.recurrence?.customDays || []);
      setNotes(item.notes || '');
      setChecklist(item.checklist || []);
      setComments(item.comments || []);
      setShowMore(!!(item.recurrence || item.notes || item.endDate));
    } else {
      setTitle('');
      setStartDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setStartTime('');
      setAreaId(areas[0]?.id || '');
      setTypeId(types[0]?.id || '');
      setRecurrenceType('');
      setCustomDays([]);
      setNotes('');
      setChecklist([]);
      setComments([]);
      setShowMore(false);
    }
    setNewChecklistText('');
    setNewCommentText('');
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [open, item, initialMode, initialDate, occurrenceDate]);

  useEffect(() => {
    if (!open || item) return;

    if (!areaId && areas[0]?.id) {
      setAreaId(areas[0].id);
    }

    if (!typeId && types[0]?.id) {
      setTypeId(types[0].id);
    }
  }, [open, item, areaId, typeId, areas, types]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      startDate,
      endDate: endDate || undefined,
      startTime: startTime || undefined,
      endTime: undefined,
      areaId,
      typeId,
      recurrence: recurrenceType
        ? { type: recurrenceType, customDays: recurrenceType === 'custom' ? customDays : undefined }
        : undefined,
      notes: notes || undefined,
      status: item?.status || 'pending' as const,
      checklist: checklist.length > 0 ? checklist : undefined,
      comments: comments.length > 0 ? comments : undefined,
    };

    if (mode === 'edit' && item) {
      onUpdate(item.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: newChecklistText.trim(),
      done: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText('');
    // Auto-save in view mode
    if (mode === 'view' && item) {
      onUpdate(item.id, { checklist: updated });
    }
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklist(updated);
    if (item) {
      onUpdate(item.id, { checklist: updated });
    }
  };

  const removeChecklistItem = (id: string) => {
    const updated = checklist.filter(c => c.id !== id);
    setChecklist(updated);
    if (mode === 'view' && item) {
      onUpdate(item.id, { checklist: updated });
    }
  };

  const addComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: Comment = {
      id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');
    if (item) {
      onUpdate(item.id, { comments: updated });
    }
  };

  const removeComment = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    if (item) {
      onUpdate(item.id, { comments: updated });
    }
  };

  const area = areas.find(a => a.id === (item?.areaId || areaId));
  const type = types.find(t => t.id === (item?.typeId || typeId));
  const isView = mode === 'view';
  const checklistDoneCount = checklist.filter(c => c.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm dark:bg-overlay/75" />
      <div
        className={cn(
          'relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-lg bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 px-6 pb-6 pt-4 shadow-xl sm:rounded-lg animate-in slide-in-from-bottom-4 duration-300',
          isView && calendarViewMode === 'month' ? 'max-w-xl' : 'max-w-md'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {mode === 'create' ? 'Novo Item' : mode === 'edit' ? 'Editar Item' : ''}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isView && item ? (
          <div className="space-y-4">
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

            <div className="flex items-start gap-3">
              <button
                onClick={() => { onToggleStatus(item.id, occurrenceDate); setStatus(s => s === 'done' ? 'pending' : 'done'); }}
                className={cn(
                  'mt-1.5 h-5 w-5 rounded-full border-2 transition-colors flex-shrink-0 flex items-center justify-center',
                  status === 'done' ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}
              >
                {status === 'done' && <Check className="h-3 w-3 text-primary-foreground" />}
              </button>
              <h3 className="text-xl font-medium">{item.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(parseLocalDate(item.startDate), 'dd/MM/yyyy')}
                {item.endDate ? ` — ${format(parseLocalDate(item.endDate), 'dd/MM/yyyy')}` : ''}
              </span>
              {item.startTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {item.startTime}
                </span>
              )}
              {item.recurrence && (
                <span className="inline-flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5" />
                  {RECURRENCE_LABELS[item.recurrence.type]}
                </span>
              )}
            </div>

            {item.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</span>
                  <Separator className="flex-1" />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </div>
              </div>
            )}

            {/* Checklist Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Checklist {checklist.length > 0 && `(${checklistDoneCount}/${checklist.length})`}
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-1 mb-2">
                {checklist.map(cl => (
                  <div key={cl.id} className="flex items-center gap-2 group">
                    <CheckIndicator size="sm" done={cl.done} onClick={() => toggleChecklistItem(cl.id)} />
                    <span className={cn('text-sm flex-1', cl.done && 'text-muted-foreground line-through')}>{cl.text}</span>
                    <button
                      onClick={() => removeChecklistItem(cl.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  placeholder="Adicionar item..."
                  className="h-8 text-sm flex-1"
                />
                <Button type="button" size="sm" variant="ghost" onClick={addChecklistItem} className="h-8 w-8 p-0" disabled={!newChecklistText.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Comentários {comments.length > 0 && `(${comments.length})`}
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-2 mb-2">
                {comments.map(cm => (
                  <div key={cm.id} className="rounded-lg bg-muted/50 p-2.5 group relative">
                    <p className="text-sm">{cm.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(cm.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                    <button
                      onClick={() => removeComment(cm.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addComment())}
                  placeholder="Escrever comentário..."
                  className="h-8 text-sm flex-1"
                />
                <Button type="button" size="sm" variant="ghost" onClick={addComment} className="h-8 w-8 p-0" disabled={!newCommentText.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMode('edit')} className="text-xs gap-1.5">
                <Edit2 className="h-3 w-3" />
                Editar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (item.recurrence && occurrenceDate) { setDeleteOpen(true); return; }
                  onDelete(item.id);
                  onClose();
                }}
                className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Trash2 className="h-3 w-3" />
                Excluir
              </Button>

              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir item recorrente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Este item se repete em vários dias. O que você quer fazer?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-end gap-2">
                    <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="text-xs"
                      onClick={() => { onDelete(item.id, occurrenceDate); setDeleteOpen(false); onClose(); }}
                    >
                      Apenas este dia
                    </AlertDialogAction>
                    <AlertDialogAction
                      className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => { onDelete(item.id); setDeleteOpen(false); onClose(); }}
                    >
                      Todos os dias
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'mt-1 h-9 w-full justify-start px-3 text-sm font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-60" />
                      {startDate ? format(parseLocalDate(startDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate ? parseLocalDate(startDate) : undefined}
                      onSelect={d => d && setStartDate(format(d, 'yyyy-MM-dd'))}
                      initialFocus
                      locale={ptBR}
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hora</Label>
                <Select value={startTime || '__none__'} onValueChange={v => setStartTime(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <SelectValue placeholder="Selecionar" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50 max-h-60">
                    <SelectItem value="__none__">Sem horário</SelectItem>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>


            {/* Progressive disclosure */}
            {!showMore ? (
              <button type="button" onClick={() => setShowMore(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" /> Mais opções
              </button>
            ) : (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Recorrência</Label>
                    <Select value={recurrenceType || 'none'} onValueChange={v => setRecurrenceType(v === 'none' ? '' : (v as RecurrenceType))}>
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

                  <div>
                    <Label className="text-xs text-muted-foreground">Data final (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'mt-1 h-9 w-full justify-start px-3 text-sm font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-60" />
                          {endDate ? format(parseLocalDate(endDate), "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Selecionar'}
                          {endDate && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); setEndDate(''); }}
                              className="ml-auto text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate ? parseLocalDate(endDate) : undefined}
                          onSelect={d => d && setEndDate(format(d, 'yyyy-MM-dd'))}
                          initialFocus
                          locale={ptBR}
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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

                {/* Checklist in edit/create mode */}
                <div>
                  <Label className="text-xs text-muted-foreground">Checklist</Label>
                  <div className="space-y-1 mt-1 mb-2">
                    {checklist.map(cl => (
                      <div key={cl.id} className="flex items-center gap-2 group">
                        <CheckIndicator size="sm" done={cl.done} onClick={() => toggleChecklistItem(cl.id)} />
                        <span className={cn('text-sm flex-1', cl.done && 'text-muted-foreground line-through')}>{cl.text}</span>
                        <button type="button" onClick={() => removeChecklistItem(cl.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                      placeholder="Adicionar item..."
                      className="h-8 text-sm flex-1"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={addChecklistItem} className="h-8 w-8 p-0" disabled={!newChecklistText.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
