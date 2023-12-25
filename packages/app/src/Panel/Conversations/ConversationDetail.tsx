import { Button, Form, Input, Tabs, TabsProps } from 'antd';
import cx from 'classnames';

import { CategoryCascader } from '../components/CategoryCascader';
import { useUpdateConversation } from '../hooks/conversation';
import { useVisitor } from '../hooks/visitor';
import { useConversationContext } from './contexts/ConversationContext';

const tabsItems: TabsProps['items'] = [
  {
    key: 'convInfo',
    label: '会话信息',
    children: <ConversationInfo />,
  },
  {
    key: 'userInfo',
    label: '用户信息',
    children: <VisitorInfo />,
  },
];

function ConversationInfo() {
  const { conversation } = useConversationContext();

  const { mutate: update } = useUpdateConversation();

  return (
    <div className="pt-2">
      <div className="">
        <div className="font-medium mb-1">分类</div>
        <CategoryCascader
          allowClear={false}
          placeholder="-"
          categoryId={conversation.categoryId}
          onCategoryIdChange={(categoryId) => {
            update({ id: conversation.id, categoryId });
          }}
          style={{ width: '100%' }}
        />
        {conversation.source && (
          <>
            <div className="font-medium mt-4 mb-1 truncate" title={conversation.source.url}>
              来源
            </div>
            <div>{conversation.source.url}</div>
          </>
        )}
      </div>
    </div>
  );
}

function VisitorInfo() {
  const { conversation } = useConversationContext();

  const { data, isLoading, update, isUpdating } = useVisitor(conversation.visitorId);

  if (isLoading) {
    return null;
  }

  return (
    <div className="pt-2">
      <Form layout="vertical" initialValues={data} onFinish={update}>
        <div className="mb-5">ID: {conversation.visitorId}</div>
        <Form.Item label="昵称" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="备注" name="comment">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form>
    </div>
  );
}

interface ConversationDetailProps {
  className?: string;
}

export function ConversationDetail({ className }: ConversationDetailProps) {
  return (
    <div className={cx('p-4 pt-2', className)}>
      <Tabs size="small" items={tabsItems} />
    </div>
  );
}
