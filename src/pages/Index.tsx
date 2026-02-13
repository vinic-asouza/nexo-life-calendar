import { useState, useCallback } from 'react';
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

const Index = () => {
  const { items, addItem, updateItem, deleteItem, toggleStatus } = useItems();
  const { areas, addArea, updateArea, deleteArea } = useAreas();
  const { types, addType, updateType, deleteType, reorderTypes } = useTypes();
  const { currentDate, viewMode, setViewMode, goNext, goPrev, goToday } = useCalendarNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ areaIds: [], typeIds: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();

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
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleItemClick = useCallback((item: CalendarItem) => {
    setSelectedItem(item);
    setModalMode('view');
    setModalOpen(true);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    // On mobile, toggle drawer
    if (window.innerWidth < 768) {
      setSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
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
          onAddType={addType}
          onUpdateType={updateType}
          onDeleteType={deleteType}
          onReorderTypes={reorderTypes}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          {viewMode === 'day' && (
            <DayView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} onToggleStatus={toggleStatus} />
          )}
          {viewMode === 'week' && (
            <WeekView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} onToggleStatus={toggleStatus} />
          )}
          {viewMode === 'month' && (
            <MonthView date={currentDate} items={items} areas={areas} types={types} filters={filters} onItemClick={handleItemClick} onAddItem={handleAddItem} />
          )}
        </main>
      </div>

      <ItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        areas={areas}
        types={types}
        initialDate={initialDate}
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
