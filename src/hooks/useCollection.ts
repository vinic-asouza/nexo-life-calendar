import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Shared CRUD + ordering logic for the user-scoped, orderable collections
 * (areas and types). Both repositories expose the same contract, so the
 * cache handling (optimistic write + invalidate) lives here only once.
 */
export interface CollectionRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  create(input: Omit<T, 'id'>): Promise<T>;
  update(id: string, updates: Partial<Omit<T, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

export function useCollection<T extends { id: string }>(
  resource: string,
  repository: CollectionRepository<T>,
  staleTime = 60_000,
) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = useMemo(() => [resource, user?.id], [resource, user?.id]);

  const { data: items = [] } = useQuery({
    queryKey: key,
    queryFn: () => repository.list(),
    enabled: !!user,
    staleTime,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: key });
  }, [qc, key]);

  const add = useCallback(
    async (input: Omit<T, 'id'>) => {
      const created = await repository.create(input);
      qc.setQueryData<T[]>(key, (prev = []) => [...prev, created]);
      return created;
    },
    [qc, key, repository],
  );

  const update = useCallback(
    async (id: string, updates: Partial<Omit<T, 'id'>>) => {
      qc.setQueryData<T[]>(key, (prev = []) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      try {
        await repository.update(id, updates);
      } finally {
        invalidate();
      }
    },
    [qc, key, repository, invalidate],
  );

  const remove = useCallback(
    async (id: string) => {
      qc.setQueryData<T[]>(key, (prev = []) => prev.filter((i) => i.id !== id));
      try {
        await repository.remove(id);
      } finally {
        invalidate();
      }
    },
    [qc, key, repository, invalidate],
  );

  const reorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const current = qc.getQueryData<T[]>(key) ?? [];
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      qc.setQueryData<T[]>(key, next);
      try {
        await repository.reorder(next.map((i) => i.id));
      } finally {
        invalidate();
      }
    },
    [qc, key, repository, invalidate],
  );

  return { items, add, update, remove, reorder };
}
