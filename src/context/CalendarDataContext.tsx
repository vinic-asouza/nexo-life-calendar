import { createContext, useContext } from 'react';
import { useAreas } from '@/hooks/useAreas';
import { useItems } from '@/hooks/useItems';
import { useTypes } from '@/hooks/useTypes';

type CalendarDataContextValue = ReturnType<typeof useItems> & ReturnType<typeof useAreas> & ReturnType<typeof useTypes>;

const CalendarDataContext = createContext<CalendarDataContextValue | null>(null);

export function CalendarDataProvider({ children }: { children: React.ReactNode }) {
  const itemsState = useItems();
  const areasState = useAreas();
  const typesState = useTypes();

  return (
    <CalendarDataContext.Provider value={{ ...itemsState, ...areasState, ...typesState }}>
      {children}
    </CalendarDataContext.Provider>
  );
}

export function useCalendarData() {
  const context = useContext(CalendarDataContext);

  if (!context) {
    throw new Error('useCalendarData must be used within CalendarDataProvider');
  }

  return context;
}