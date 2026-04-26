import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Area } from '@/types';
import { repositories } from '@/repositories';
import { useAuth } from '@/context/AuthContext';

const QK = ['areas'] as const;

export function useAreas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = [...QK, user?.id];

  const { data: areas = [] } = useQuery({
    queryKey: key,
    queryFn: () => repositories.areas.list(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const addArea = useCallback(async (area: Omit<Area, 'id'>) => {
    const created = await repositories.areas.create(area);
    qc.setQueryData<Area[]>(key, (prev = []) => [...prev, created]);
    return created;
  }, [qc, key]);

  const updateArea = useCallback(async (id: string, updates: Partial<Omit<Area, 'id'>>) => {
    qc.setQueryData<Area[]>(key, (prev = []) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    try { await repositories.areas.update(id, updates); } finally { invalidate(); }
  }, [qc, key]);

  const deleteArea = useCallback(async (id: string) => {
    qc.setQueryData<Area[]>(key, (prev = []) => prev.filter((a) => a.id !== id));
    try { await repositories.areas.remove(id); } finally { invalidate(); }
  }, [qc, key]);

  const reorderAreas = useCallback(async (fromIndex: number, toIndex: number) => {
    const current = qc.getQueryData<Area[]>(key) ?? [];
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    qc.setQueryData<Area[]>(key, next);
    try { await repositories.areas.reorder(next.map((a) => a.id)); } finally { invalidate(); }
  }, [qc, key]);

  return { areas, addArea, updateArea, deleteArea, reorderAreas };
}
