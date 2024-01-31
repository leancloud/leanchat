import { useCallback, useMemo } from 'react';
import _ from 'lodash';

import { Category } from '@/Panel/types';

export function useGetCategoryName(categories?: Category[]) {
  const categoryMap = useMemo(() => _.keyBy(categories, (c) => c.id), [categories]);
  const getCategoryPath = useCallback(
    (id: string): Category[] => {
      const category = categoryMap[id];
      if (category) {
        return category.parentId ? [...getCategoryPath(category.parentId), category] : [category];
      }
      return [];
    },
    [categoryMap],
  );
  return useCallback(
    (id: string) => {
      return getCategoryPath(id)
        .map((c) => c.name)
        .join('/');
    },
    [getCategoryPath],
  );
}
