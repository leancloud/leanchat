import { Tabs, TabsProps } from 'antd';

import { CategoryCascader } from '../components/CategoryCascader';
import { SkillGroupSelect } from '../components/SkillGroupSelect';
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

  const { mutate: update } = useUpdateConversation();

  return (
    <div className="pt-2">
      <div className="">
        <div className="font-medium mb-1">技能组</div>
        <SkillGroupSelect placeholder="-" style={{ width: '100%' }} />
        <div className="font-medium mt-2 mb-1">分类</div>
        <CategoryCascader
          allowClear={false}
          placeholder="-"
          categoryId={conversation.categoryId}
          onCategoryIdChange={(categoryId) => {
            update([conversation.id, { categoryId }]);
          }}
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
