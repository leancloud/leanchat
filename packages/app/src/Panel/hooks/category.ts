import { useQuery } from '@tanstack/react-query';

import { getCategories } from '../api/category';
import { Category } from '../types';
import { useMemo } from 'react';

export function useCategories() {
  return useQuery({
    queryKey: ['Categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });
}

interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[];
  parent?: CategoryTreeNode;
}

function createCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const nodes = categories.map<CategoryTreeNode>((c) => ({ ...c }));
  const roots = nodes.filter((category) => !category.parentId);
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift()!;
    const children = nodes.filter((c) => c.parentId === current.id);
    if (children.length) {
      current.children = children;
      children.forEach((c) => {
        c.parent = current;
        queue.push(c);
      });
    }
  }
  return roots;
}

export function useCategoryTree(categories?: Category[]) {
  return useMemo(() => {
    if (categories) {
      return createCategoryTree(categories);
    }
  }, [categories]);
}
