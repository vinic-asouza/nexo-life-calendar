import { Area } from '@/types';
import { repositories } from '@/repositories';
import { useCollection } from '@/hooks/useCollection';

export function useAreas() {
  const { items, add, update, remove, reorder } = useCollection<Area>('areas', repositories.areas);

  return {
    areas: items,
    addArea: add,
    updateArea: update,
    deleteArea: remove,
    reorderAreas: reorder,
  };
}
