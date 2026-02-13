import { useState } from 'react';
import { Plus, X, Edit2, Trash2, Palette, Tag, User, ChevronDown, ChevronRight } from 'lucide-react';
import { Area, ItemType, FilterState } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PRESET_COLORS = [
  '217 91% 60%', '37 92% 60%', '142 71% 45%', '340 82% 52%',
  '262 83% 58%', '25 95% 53%', '173 80% 40%', '0 72% 51%',
];

interface AppSidebarProps {
  areas: Area[];
  types: ItemType[];
  filters: FilterState;
  onToggleAreaFilter: (id: string) => void;
  onToggleTypeFilter: (id: string) => void;
  onAddArea: (area: Omit<Area, 'id'>) => void;
  onUpdateArea: (id: string, updates: Partial<Omit<Area, 'id'>>) => void;
  onDeleteArea: (id: string) => void;
  onAddType: (t: Omit<ItemType, 'id'>) => void;
  onUpdateType: (id: string, updates: Partial<Omit<ItemType, 'id'>>) => void;
  onDeleteType: (id: string) => void;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export function AppSidebar({
  areas, types, filters,
  onToggleAreaFilter, onToggleTypeFilter,
  onAddArea, onUpdateArea, onDeleteArea,
  onAddType, onUpdateType, onDeleteType,
  open, collapsed, onClose,
}: AppSidebarProps) {
  const [areasOpen, setAreasOpen] = useState(true);
  const [typesOpen, setTypesOpen] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(PRESET_COLORS[0]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);

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

  const sidebarWidth = collapsed ? 'w-0 md:w-14' : 'w-60';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300 md:relative md:z-auto md:translate-x-0 md:flex overflow-hidden',
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
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className={cn('flex-1 overflow-y-auto p-3 space-y-5', collapsed && 'hidden md:hidden')}>
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
                <PopoverContent side="right" align="start" className="w-56 p-3 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50">
                  <p className="text-xs font-semibold mb-2">Nova Área</p>
                  <Input
                    placeholder="Nome da área"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                    className="h-8 text-sm mb-2"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewAreaColor(c)}
                        className={cn('h-5 w-5 rounded-full transition-transform', newAreaColor === c && 'ring-2 ring-offset-1 ring-offset-card ring-primary scale-110')}
                        style={{ backgroundColor: `hsl(${c})` }}
                      />
                    ))}
                  </div>
                  <Button size="sm" onClick={handleAddArea} className="w-full h-7 text-xs" disabled={!newAreaName.trim()}>Criar</Button>
                </PopoverContent>
              </Popover>
            </div>

            <CollapsibleContent className="mt-2 space-y-0.5">
              {areas.map(area => (
                <div key={area.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={filters.areaIds.length === 0 || filters.areaIds.includes(area.id)}
                    onCheckedChange={() => onToggleAreaFilter(area.id)}
                    className="border-2"
                    style={{ borderColor: `hsl(${area.color})`, backgroundColor: (filters.areaIds.length === 0 || filters.areaIds.includes(area.id)) ? `hsl(${area.color})` : 'transparent' }}
                  />
                  {editingArea === area.id ? (
                    <Input
                      value={area.name}
                      onChange={e => onUpdateArea(area.id, { name: e.target.value })}
                      onBlur={() => setEditingArea(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingArea(null)}
                      className="h-6 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">{area.name}</span>
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingArea(area.id)} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-3 w-3" />
                    </button>
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
                <PopoverContent side="right" align="start" className="w-56 p-3 bg-card/80 backdrop-blur-xl backdrop-saturate-150 border-border/50">
                  <p className="text-xs font-semibold mb-2">Novo Tipo</p>
                  <Input
                    placeholder="Nome do tipo"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddType()}
                    className="h-8 text-sm mb-2"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddType} className="w-full h-7 text-xs" disabled={!newTypeName.trim()}>Criar</Button>
                </PopoverContent>
              </Popover>
            </div>

            <CollapsibleContent className="mt-2 space-y-0.5">
              {types.map(t => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={filters.typeIds.length === 0 || filters.typeIds.includes(t.id)}
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

        {/* Account placeholder */}
        <div className={cn('border-t p-3', collapsed && 'hidden md:hidden')}>
          <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
            <User className="h-4 w-4" />
            Minha Conta
          </button>
        </div>
      </aside>
    </>
  );
}
