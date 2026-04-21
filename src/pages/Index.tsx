import { useState, useCallback, useEffect } from 'react';
import { CalendarItem, FilterState } from '@/types';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { DayView } from '@/components/DayView';
import { WeekView } from '@/components/WeekView';
import { MonthView } from '@/components/MonthView';
import { ItemModal } from '@/components/ItemModal';
import { useItems } from '@/hooks/useItems';
import { useAreas } from '@/hooks/useAreas';
import { useTypes } from '@/hooks/useTypes';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('nexo_theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const { items, addItem, updateItem, deleteItem, toggleStatus } = useItems();
  const { areas, addArea, updateArea, deleteArea, reorderAreas } = useAreas();
  const { types, addType, updateType, deleteType, reorderTypes } = useTypes();
  const { currentDate, setCurrentDate, viewMode, setViewMode, goNext, goPrev, goToday } = useCalendarNavigation();
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Filters store the set of SELECTED area/type ids. Empty = nothing visible.
  // Initialized lazily with all current ids so the user starts seeing everything.
  const [filters, setFilters] = useState<FilterState>(() => ({
    areaIds: areas.map(a => a.id),
    typeIds: types.map(t => t.id),
  }));

  // Auto-include newly created areas/types in the active selection
  // (otherwise a new area would be invisible until the user manually checked it).
  useEffect(() => {
    setFilters(prev => {
      const knownAreas = new Set(prev.areaIds);
      const newAreaIds = areas.filter(a => !knownAreas.has(a.id)).map(a => a.id);
      const knownTypes = new Set(prev.typeIds);
      const newTypeIds = types.filter(t => !knownTypes.has(t.id)).map(t => t.id);
      if (newAreaIds.length === 0 && newTypeIds.length === 0) return prev;
      return {
        areaIds: [...prev.areaIds, ...newAreaIds],
        typeIds: [...prev.typeIds, ...newTypeIds],
      };
    });
  }, [areas, types]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [occurrenceDate, setOccurrenceDate] = useState<string | undefined>();

  const toggleAreaFilter = useCallback((id: string) => {
    setFilters(prev => ({
      ...prev,
      areaIds: prev.areaIds.includes(id) ? prev.areaIds.filter(x => x !== id) : [...prev.areaIds, id],
    }));
  }, []);

  const toggleTypeFilter = useCallback((id: string) => {
    setFilters(prev => ({
      ...prev,
      typeIds: prev.typeIds.includes(id) ? prev.typeIds.filter(x => x !== id) : [...prev.typeIds, id],
    }));
  }, []);

  const handleAddItem = useCallback((date?: string) => {
    setSelectedItem(null);
    setInitialDate(date);
    setOccurrenceDate(undefined);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleItemClick = useCallback((item: CalendarItem, occDate?: string) => {
    setSelectedItem(item);
    setOccurrenceDate(occDate);
    setModalMode('view');
    setModalOpen(true);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const handleThemeToggle = useCallback((checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    window.localStorage.setItem('nexo_theme', theme);
  }, [theme]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onDateSelect={setCurrentDate}
        onAddItem={() => handleAddItem()}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          areas={areas}
          types={types}
          filters={filters}
          onToggleAreaFilter={toggleAreaFilter}
          onToggleTypeFilter={toggleTypeFilter}
          onAddArea={addArea}
          onUpdateArea={updateArea}
          onDeleteArea={deleteArea}
          onReorderAreas={reorderAreas}
          onAddType={addType}
          onUpdateType={updateType}
          onDeleteType={deleteType}
          onReorderTypes={reorderTypes}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          isDarkMode={theme === 'dark'}
          onThemeToggle={handleThemeToggle}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {viewMode === 'day' && (
            <DayView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} onToggleStatus={toggleStatus} />
          )}
          {viewMode === 'week' && (
            <WeekView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} onToggleStatus={toggleStatus} />
          )}
          {viewMode === 'month' && (
            <MonthView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} onToggleStatus={toggleStatus} />
          )}
        </main>
      </div>

      <ItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        areas={areas}
        types={types}
        initialDate={initialDate}
        occurrenceDate={occurrenceDate}
        item={selectedItem}
        mode={modalMode}
        onSave={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
};

export default Index;
