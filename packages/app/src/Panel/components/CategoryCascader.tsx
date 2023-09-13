import { forwardRef, useMemo } from 'react';
import { Cascader, CascaderProps } from 'antd';
import type { CascaderRef } from 'antd/es/cascader';

import { useCategories, useCategoryTree } from '../hooks/category';
import { Category } from '../types';

type CategoryCascaderProps = CascaderProps & {
  categoryId?: string;
  onCategoryIdChange?: (id: string) => void;
};

export const CategoryCascader = forwardRef<CascaderRef, CategoryCascaderProps>(
  ({ categoryId, onCategoryIdChange, ...props }, ref) => {
    const { data, isLoading } = useCategories();

    const tree = useCategoryTree(data);

    const categoryPath = useMemo(() => {
      if (!data || !categoryId) {
        return;
      }
      let currentId: string | undefined = categoryId;
      const path: Category[] = [];
      while (currentId) {
        const category = data.find((c) => c.id === currentId);
        if (category) {
          path.push(category);
          currentId = category.parentId;
        }
      }
      return path.reverse();
    }, [data, categoryId]);

    return (
      <Cascader
        ref={ref}
        loading={isLoading}
        options={tree}
        fieldNames={{ label: 'name', value: 'id', children: 'children' }}
        value={categoryPath?.map((c) => c.id)}
        onChange={(path) => {
          onCategoryIdChange?.(path && (path[path.length - 1] as string));
        }}
        {...(props as any)}
      />
    );
  },
);
