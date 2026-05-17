import { useState, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Palette, Tag, User, ChevronDown, ChevronRight, GripVertical, LayoutList, Clock } from 'lucide-react';
import { Area, ItemType, FilterState, GroupingMode } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCalendarData } from '@/context/CalendarDataContext';

const PRESET_COLORS = [
  '217 91% 60%', '37 92% 60%', '142 71% 45%', '340 82% 52%',
  '262 83% 58%', '25 95% 53%', '173 80% 40%', '0 72% 51%',
];

interface AppSidebarProps {
  filters: FilterState;
  onToggleAreaFilter: (id: string) => void;
  onToggleTypeFilter: (id: string) => void;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onThemeToggle: (checked: boolean) => void;
  grouping: GroupingMode;
  onGroupingChange: (mode: GroupingMode) => void;
}

export function AppSidebar({
  filters,
  onToggleAreaFilter, onToggleTypeFilter,
  open, collapsed, onClose,
  isDarkMode, onThemeToggle,
  grouping, onGroupingChange,
}: AppSidebarProps) {
  const { areas, types, addArea: onAddArea, updateArea: onUpdateArea, deleteArea: onDeleteArea, reorderAreas: onReorderAreas, addType: onAddType, updateType: onUpdateType, deleteType: onDeleteType, reorderTypes: onReorderTypes } = useCalendarData();
  const [areasOpen, setAreasOpen] = useState(true);
  const [typesOpen, setTypesOpen] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(PRESET_COLORS[0]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaColor, setEditAreaColor] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);

  const openEditArea = (area: Area) => {
    setEditingArea(area.id);
    setEditAreaName(area.name);
    setEditAreaColor(area.color);
  };

  const handleSaveEditArea = () => {
    if (editingArea && editAreaName.trim()) {
      onUpdateArea(editingArea, { name: editAreaName.trim(), color: editAreaColor });
      setEditingArea(null);
    }
  };

  const dragTypeIndexRef = useRef<number | null>(null);
  const [draggingTypeIndex, setDraggingTypeIndex] = useState<number | null>(null);
  const [dragTypeOverIndex, setDragTypeOverIndex] = useState<number | null>(null);
  const dragAreaIndexRef = useRef<number | null>(null);
  const [draggingAreaIndex, setDraggingAreaIndex] = useState<number | null>(null);
  const [dragAreaOverIndex, setDragAreaOverIndex] = useState<number | null>(null);

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    onAddArea({ name: newAreaName.trim(), color: newAreaColor });
    setNewAreaName('');
    setNewAreaColor(PRESET_COLORS[0]);
  };

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    onAddType({ name: newTypeName.trim() });
    setNewTypeName('');
  };

  // Type drag handlers
  const handleTypeDragStart = (index: number) => { dragTypeIndexRef.current = index; setDraggingTypeIndex(index); };
  const handleTypeDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragTypeOverIndex(index); };
  const handleTypeDrop = (index: number) => {
    if (dragTypeIndexRef.current !== null && dragTypeIndexRef.current !== index) onReorderTypes(dragTypeIndexRef.current, index);
    dragTypeIndexRef.current = null; setDraggingTypeIndex(null); setDragTypeOverIndex(null);
  };
  const handleTypeDragEnd = () => { dragTypeIndexRef.current = null; setDraggingTypeIndex(null); setDragTypeOverIndex(null); };

  // Area drag handlers
  const handleAreaDragStart = (index: number) => { dragAreaIndexRef.current = index; setDraggingAreaIndex(index); };
  const handleAreaDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragAreaOverIndex(index); };
  const handleAreaDrop = (index: number) => {
    if (dragAreaIndexRef.current !== null && dragAreaIndexRef.current !== index) onReorderAreas(dragAreaIndexRef.current, index);
    dragAreaIndexRef.current = null; setDraggingAreaIndex(null); setDragAreaOverIndex(null);
  };
  const handleAreaDragEnd = () => { dragAreaIndexRef.current = null; setDraggingAreaIndex(null); setDragAreaOverIndex(null); };

  const handleAreaTouchStart = (index: number) => {
    dragAreaIndexRef.current = index;
    setDraggingAreaIndex(index);
    setDragAreaOverIndex(index);
  };

  const handleAreaTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-area-index]');
    const index = target ? Number((target as HTMLElement).dataset.areaIndex) : NaN;
    if (!Number.isNaN(index)) setDragAreaOverIndex(index);
  };

  const handleAreaTouchEnd = () => {
    if (
      dragAreaIndexRef.current !== null &&
      dragAreaOverIndex !== null &&
      dragAreaIndexRef.current !== dragAreaOverIndex
    ) {
      onReorderAreas(dragAreaIndexRef.current, dragAreaOverIndex);
    }
    handleAreaDragEnd();
  };

  const handleTypeTouchStart = (index: number) => {
    dragTypeIndexRef.current = index;
    setDraggingTypeIndex(index);
    setDragTypeOverIndex(index);
  };

  const handleTypeTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-type-index]');
    const index = target ? Number((target as HTMLElement).dataset.typeIndex) : NaN;
    if (!Number.isNaN(index)) setDragTypeOverIndex(index);
  };

  const handleTypeTouchEnd = () => {
    if (
      dragTypeIndexRef.current !== null &&
      dragTypeOverIndex !== null &&
      dragTypeIndexRef.current !== dragTypeOverIndex
    ) {
      onReorderTypes(dragTypeIndexRef.current, dragTypeOverIndex);
    }
    handleTypeDragEnd();
  };

  const sidebarWidth = collapsed ? 'w-0 md:w-14' : 'w-60';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

        <aside className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300 md:relative md:z-auto md:translate-x-0 md:flex overflow-hidden',
        open ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0',
        !open && sidebarWidth
      )}>
        {/* Mobile close */}
        <div className="flex items-center justify-between border-b p-4 md:hidden">
          <span className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Filtros</span>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {collapsed && (
          <div className="hidden md:flex flex-col items-center gap-3 pt-4">
            {grouping === 'time' ? <Clock className="h-4 w-4 text-muted-foreground" /> : <LayoutList className="h-4 w-4 text-muted-foreground" />}
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className={cn('flex-1 overflow-y-auto p-3 space-y-5', collapsed && 'hidden md:hidden')}>
          {/* Grouping selector */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <LayoutList className="h-3.5 w-3.5" />
              Organização
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1">
              <button
                onClick={() => onGroupingChange('type')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  grouping === 'type' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Tag className="h-3 w-3" /> Tipo
              </button>
              <button
                onClick={() => onGroupingChange('time')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  grouping === 'time' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock className="h-3 w-3" /> Horário
              </button>
            </div>
          </div>

          {/* Areas Section */}
          <Collapsible open={areasOpen} onOpenChange={setAreasOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {areasOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Palette className="h-3.5 w-3.5" />
                Áreas
              </CollapsibleTrigger>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-60 p-4 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50 space-y-3">
                  <p className="text-xs font-semibold">Nova Área</p>
                  <Input
                    placeholder="Nome da área"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Cor</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewAreaColor(c)}
                          className={cn('h-6 w-6 rounded-full transition-transform', newAreaColor === c && 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-110')}
                          style={{ backgroundColor: `hsl(${c})` }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddArea} className="w-full h-8 text-xs" disabled={!newAreaName.trim()}>Criar Área</Button>
                </PopoverContent>
              </Popover>
            </div>

            <CollapsibleContent className="mt-2 space-y-0.5">
              {areas.map((area, index) => (
                <div
                  key={area.id}
                  data-area-index={index}
                  draggable
                  onDragStart={() => handleAreaDragStart(index)}
                  onDragOver={e => handleAreaDragOver(e, index)}
                  onDrop={() => handleAreaDrop(index)}
                  onDragEnd={handleAreaDragEnd}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors',
                    dragAreaOverIndex === index && 'border-t-2 border-primary',
                    draggingAreaIndex === index && 'cursor-grabbing bg-muted/60 opacity-60 ring-1 ring-border'
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Reordenar área ${area.name}`}
                    onTouchStart={() => handleAreaTouchStart(index)}
                    onTouchMove={handleAreaTouchMove}
                    onTouchEnd={handleAreaTouchEnd}
                    onTouchCancel={handleAreaDragEnd}
                    className={cn(
                      'text-muted-foreground transition-opacity touch-none',
                      draggingAreaIndex === index ? 'cursor-grabbing opacity-100' : 'cursor-grab opacity-0 group-hover:opacity-100 md:group-hover:opacity-100'
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                  <Checkbox
                    checked={filters.areaIds.includes(area.id)}
                    onCheckedChange={() => onToggleAreaFilter(area.id)}
                    className="border-2"
                    style={{ borderColor: `hsl(${area.color})`, backgroundColor: filters.areaIds.includes(area.id) ? `hsl(${area.color})` : 'transparent' }}
                  />
                  <span className="flex-1 text-sm truncate">{area.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover open={editingArea === area.id} onOpenChange={(open) => { if (!open) setEditingArea(null); }}>
                      <PopoverTrigger asChild>
                        <button onClick={() => openEditArea(area)} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" className="w-60 p-4 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50 space-y-3">
                        <p className="text-xs font-semibold">Editar Área</p>
                        <Input
                          placeholder="Nome da área"
                          value={editAreaName}
                          onChange={e => setEditAreaName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEditArea()}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Cor</p>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setEditAreaColor(c)}
                                className={cn('h-6 w-6 rounded-full transition-transform', editAreaColor === c && 'ring-2 ring-offset-2 ring-offset-card ring-primary scale-110')}
                                style={{ backgroundColor: `hsl(${c})` }}
                              />
                            ))}
                          </div>
                        </div>
                        <Button size="sm" onClick={handleSaveEditArea} className="w-full h-8 text-xs" disabled={!editAreaName.trim()}>Salvar</Button>
                      </PopoverContent>
                    </Popover>
                    <button onClick={() => onDeleteArea(area.id)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Types Section */}
          <Collapsible open={typesOpen} onOpenChange={setTypesOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {typesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Tag className="h-3.5 w-3.5" />
                Tipos
              </CollapsibleTrigger>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-60 p-4 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50 space-y-3">
                  <p className="text-xs font-semibold">Novo Tipo</p>
                  <Input
                    placeholder="Nome do tipo"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddType()}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddType} className="w-full h-8 text-xs" disabled={!newTypeName.trim()}>Criar Tipo</Button>
                </PopoverContent>
              </Popover>
            </div>

            <CollapsibleContent className="mt-2 space-y-0.5">
              {types.map((t, index) => (
                <div
                  key={t.id}
                  data-type-index={index}
                  draggable
                  onDragStart={() => handleTypeDragStart(index)}
                  onDragOver={e => handleTypeDragOver(e, index)}
                  onDrop={() => handleTypeDrop(index)}
                  onDragEnd={handleTypeDragEnd}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors',
                    dragTypeOverIndex === index && 'border-t-2 border-primary',
                    draggingTypeIndex === index && 'cursor-grabbing bg-muted/60 opacity-60 ring-1 ring-border'
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Reordenar tipo ${t.name}`}
                    onTouchStart={() => handleTypeTouchStart(index)}
                    onTouchMove={handleTypeTouchMove}
                    onTouchEnd={handleTypeTouchEnd}
                    onTouchCancel={handleTypeDragEnd}
                    className={cn(
                      'text-muted-foreground transition-opacity touch-none',
                      draggingTypeIndex === index ? 'cursor-grabbing opacity-100' : 'cursor-grab opacity-0 group-hover:opacity-100 md:group-hover:opacity-100'
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                  <Checkbox
                    checked={filters.typeIds.includes(t.id)}
                    onCheckedChange={() => onToggleTypeFilter(t.id)}
                  />
                  {editingType === t.id ? (
                    <Input
                      value={t.name}
                      onChange={e => onUpdateType(t.id, { name: e.target.value })}
                      onBlur={() => setEditingType(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingType(null)}
                      className="h-6 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">{t.name}</span>
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingType(t.id)} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDeleteType(t.id)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={cn('border-t p-3 space-y-2', collapsed && 'hidden md:hidden')}>
          <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-muted-foreground">
            <span>Tema escuro</span>
            <Switch checked={isDarkMode} onCheckedChange={onThemeToggle} aria-label="Alternar tema" />
          </div>
          <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
            <User className="h-4 w-4" />
            Minha Conta
          </button>
        </div>
      </aside>
    </>
  );
}
