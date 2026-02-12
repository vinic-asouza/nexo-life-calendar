import { useState, useCallback } from 'react';
import { ItemType } from '@/types';
import { getTypes, saveTypes } from '@/services/storage';

export function useTypes() {
  const [types, setTypes] = useState<ItemType[]>(getTypes);

  const persist = useCallback((next: ItemType[]) => {
    setTypes(next);
    saveTypes(next);
  }, []);

  const addType = useCallback((t: Omit<ItemType, 'id'>) => {
    const newType: ItemType = { ...t, id: `type-${Date.now()}` };
    persist([...getTypes(), newType]);
    return newType;
  }, [persist]);

  const updateType = useCallback((id: string, updates: Partial<Omit<ItemType, 'id'>>) => {
    persist(getTypes().map(t => t.id === id ? { ...t, ...updates } : t));
  }, [persist]);

  const deleteType = useCallback((id: string) => {
    persist(getTypes().filter(t => t.id !== id));
  }, [persist]);

  return { types, addType, updateType, deleteType };
}
