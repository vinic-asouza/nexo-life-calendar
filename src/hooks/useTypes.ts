import { useState, useCallback, useEffect } from 'react';
import { ItemType } from '@/types';
import { getTypes, saveTypes } from '@/services/storage';

const STORAGE_KEY = 'nexo_types';

export function useTypes() {
  const [types, setTypes] = useState<ItemType[]>(getTypes);

  const mutate = useCallback((updater: (prev: ItemType[]) => ItemType[]) => {
    setTypes(prev => {
      const next = updater(prev);
      saveTypes(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      try {
        setTypes(JSON.parse(e.newValue) as ItemType[]);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addType = useCallback((t: Omit<ItemType, 'id'>) => {
    const newType: ItemType = { ...t, id: `type-${Date.now()}` };
    mutate(prev => [...prev, newType]);
    return newType;
  }, [mutate]);

  const updateType = useCallback((id: string, updates: Partial<Omit<ItemType, 'id'>>) => {
    mutate(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [mutate]);

  const deleteType = useCallback((id: string) => {
    mutate(prev => prev.filter(t => t.id !== id));
  }, [mutate]);

  const reorderTypes = useCallback((fromIndex: number, toIndex: number) => {
    mutate(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [mutate]);

  return { types, addType, updateType, deleteType, reorderTypes };
}
