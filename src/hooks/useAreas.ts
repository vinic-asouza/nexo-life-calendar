import { useState, useCallback, useEffect } from 'react';
import { Area } from '@/types';
import { getAreas, parseStoredAreas, saveAreas } from '@/services/storage';

const STORAGE_KEY = 'nexo_areas';

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>(getAreas);

  const mutate = useCallback((updater: (prev: Area[]) => Area[]) => {
    setAreas(prev => {
      const next = updater(prev);
      saveAreas(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      setAreas(parseStoredAreas(e.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addArea = useCallback((area: Omit<Area, 'id'>) => {
    const newArea: Area = { ...area, id: `area-${Date.now()}` };
    mutate(prev => [...prev, newArea]);
    return newArea;
  }, [mutate]);

  const updateArea = useCallback((id: string, updates: Partial<Omit<Area, 'id'>>) => {
    mutate(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, [mutate]);

  const deleteArea = useCallback((id: string) => {
    mutate(prev => prev.filter(a => a.id !== id));
  }, [mutate]);

  const reorderAreas = useCallback((fromIndex: number, toIndex: number) => {
    mutate(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [mutate]);

  return { areas, addArea, updateArea, deleteArea, reorderAreas };
}
