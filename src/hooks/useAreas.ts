import { useState, useCallback } from 'react';
import { Area } from '@/types';
import { getAreas, saveAreas } from '@/services/storage';

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>(getAreas);

  const persist = useCallback((next: Area[]) => {
    setAreas(next);
    saveAreas(next);
  }, []);

  const addArea = useCallback((area: Omit<Area, 'id'>) => {
    const newArea: Area = { ...area, id: `area-${Date.now()}` };
    persist([...getAreas(), newArea]);
    return newArea;
  }, [persist]);

  const updateArea = useCallback((id: string, updates: Partial<Omit<Area, 'id'>>) => {
    persist(getAreas().map(a => a.id === id ? { ...a, ...updates } : a));
  }, [persist]);

  const deleteArea = useCallback((id: string) => {
    persist(getAreas().filter(a => a.id !== id));
  }, [persist]);

  return { areas, addArea, updateArea, deleteArea };
}
