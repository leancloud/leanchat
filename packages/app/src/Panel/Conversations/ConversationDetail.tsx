import { useMemo } from 'react';
import { Cascader, Tabs, TabsProps } from 'antd';

import { useCategories, useCategoryTree } from '../hooks/category';
import { Category } from '../types';
import { useUpdateConversation } from '../hooks/conversation';
import { useConversationContext } from './ConversationContext';

const tabsItems: TabsProps['items'] = [
  {
    key: 'convInfo',
    label: '会话信息',
    children: <ConversationInfo />,
  },
  {
    key: 'userInfo',
    label: '用户信息',
    children: null,
  },
];

function ConversationInfo() {
  const { conversation } = useConversationContext();

  const { data: categories } = useCategories();
  const categoryTree = useCategoryTree(categories);

  const categoryPath = useMemo(() => {
    if (!categories || !conversation.categoryId) {
      return;
    }
    let currentId: string | undefined = conversation.categoryId;
    const path: Category[] = [];
    while (currentId) {
      const category = categories.find((c) => c.id === currentId);
      if (category) {
        path.push(category);
        currentId = category.parentId;
      }
    }
    return path.reverse();
  }, [categories, conversation.categoryId]);

  const { mutate: update } = useUpdateConversation();

  return (
    <div className="pt-2">
      <div className="">
        <div className="font-medium mb-1">路径</div>
        <Cascader
          options={categoryTree}
          allowClear={false}
          fieldNames={{ label: 'name', value: 'id', children: 'children' }}
          placeholder="-"
          value={categoryPath?.map((c) => c.id)}
          onChange={(path) =>
            update([conversation.id, { categoryId: path[path.length - 1] as string }])
          }
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

interface ConversationDetailProps {}

export function ConversationDetail({}: ConversationDetailProps) {
  return (
    <div className="w-[320px] border-l shrink-0 p-4 pt-2">
      <Tabs size="small" items={tabsItems} />
    </div>
  );
}
