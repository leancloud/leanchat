import { useMemo } from 'react';
import { Select, SelectProps, Tabs, TabsProps } from 'antd';

import { useOperators } from '@/Panel/hooks/operator';
import { useConversationContext } from './ConversationContext';
import { useMutation } from '@tanstack/react-query';
import { callRpc, useSocket } from '@/socket';

const tabsItems: TabsProps['items'] = [
  {
    key: 'info',
    label: '信息',
    children: <ConversationInfo />,
  },
];

const statusText: Record<string, string> = {
  ready: '在线',
  busy: '忙碌',
  leave: '离线',
};

function ConversationInfo() {
  const socket = useSocket();
  const { conversation } = useConversationContext();

  const { data: operators } = useOperators();

  const operatorOptions = useMemo<SelectProps['options']>(() => {
    return operators?.map((o) => ({
      label: `${o.internalName} (${statusText[o.status]})`,
      value: o.id,
      disabled: o.status !== 'ready',
    }));
  }, [operators]);

  const { mutate: assignConversation } = useMutation({
    mutationFn: async (operatorId: string) => {
      await callRpc(socket, 'assignConversation', {
        conversationId: conversation.id,
        operatorId,
      });
    },
  });

  return (
    <div>
      <Select
        size="large"
        options={operatorOptions}
        value={conversation.operatorId}
        onChange={(id) => assignConversation(id)}
        style={{ width: '100%' }}
      />
    </div>
  );
}

interface ConversationDetailProps {}

export function ConversationDetail({}: ConversationDetailProps) {
  return (
    <div className="w-[320px] p-5 border-l shrink-0 bg-white">
      <Tabs size="small" items={tabsItems} />
    </div>
  );
}
