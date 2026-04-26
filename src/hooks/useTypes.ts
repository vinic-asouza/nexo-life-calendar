import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ItemType } from '@/types';
import { repositories } from '@/repositories';
import { useAuth } from '@/context/AuthContext';

const QK = ['types'] as const;

export function useTypes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = [...QK, user?.id];

  const { data: types = [] } = useQuery({
    queryKey: key,
    queryFn: () => repositories.types.list(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const addType = useCallback(async (t: Omit<ItemType, 'id'>) => {
    const created = await repositories.types.create(t);
    qc.setQueryData<ItemType[]>(key, (prev = []) => [...prev, created]);
    return created;
  }, [qc, key]);

  const updateType = useCallback(async (id: string, updates: Partial<Omit<ItemType, 'id'>>) => {
    qc.setQueryData<ItemType[]>(key, (prev = []) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try { await repositories.types.update(id, updates); } finally { invalidate(); }
  }, [qc, key]);

  const deleteType = useCallback(async (id: string) => {
    qc.setQueryData<ItemType[]>(key, (prev = []) => prev.filter((t) => t.id !== id));
    try { await repositories.types.remove(id); } finally { invalidate(); }
  }, [qc, key]);

  const reorderTypes = useCallback(async (fromIndex: number, toIndex: number) => {
    const current = qc.getQueryData<ItemType[]>(key) ?? [];
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    qc.setQueryData<ItemType[]>(key, next);
    try { await repositories.types.reorder(next.map((t) => t.id)); } finally { invalidate(); }
  }, [qc, key]);

  return { types, addType, updateType, deleteType, reorderTypes };
}
