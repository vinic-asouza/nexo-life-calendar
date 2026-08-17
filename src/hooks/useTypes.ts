import { ItemType } from '@/types';
import { repositories } from '@/repositories';
import { useCollection } from '@/hooks/useCollection';

export function useTypes() {
  const { items, add, update, remove, reorder } = useCollection<ItemType>('types', repositories.types);

  return {
    types: items,
    addType: add,
    updateType: update,
    deleteType: remove,
    reorderTypes: reorder,
  };
}
