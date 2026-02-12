import { useState, useCallback } from 'react';
import { ViewMode } from '@/types';
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, startOfToday } from 'date-fns';

export function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const goNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day': return addDays(prev, 1);
        case 'week': return addWeeks(prev, 1);
        case 'month': return addMonths(prev, 1);
      }
    });
  }, [viewMode]);

  const goPrev = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day': return subDays(prev, 1);
        case 'week': return subWeeks(prev, 1);
        case 'month': return subMonths(prev, 1);
      }
    });
  }, [viewMode]);

  const goToday = useCallback(() => {
    setCurrentDate(startOfToday());
  }, []);

  return { currentDate, setCurrentDate, viewMode, setViewMode, goNext, goPrev, goToday };
}
