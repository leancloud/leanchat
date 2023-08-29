import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal, Select, SelectProps } from 'antd';

import { callRpc, useSocket } from '@/socket';
import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { useConversationContext } from './ConversationContext';

interface ReassignModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReassignModal({ open, onClose }: ReassignModalProps) {
  const socket = useSocket();
  const { conversation } = useConversationContext();
  const [operatorId, setOperatorId] = useState(conversation.operatorId);

  const { data: operators } = useOperators();

  const operatorOptions = useMemo<SelectProps['options']>(() => {
    return operators?.map((o) => ({
      label: (
        <div className="flex items-center">
          <Avatar size={24} status={o.status} />
          <div className="ml-2">{o.internalName}</div>
        </div>
      ),
      name: o.internalName,
      value: o.id,
      disabled: o.status !== 'ready',
    }));
  }, [operators]);

  const { mutate: assignConversation, isLoading: isUpdating } = useMutation({
    mutationFn: async (operatorId: string) => {
      await callRpc(socket, 'assignConversation', {
        conversationId: conversation.id,
        operatorId,
      });
    },
    onSuccess: onClose,
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="重新分配会话"
      okButtonProps={{ disabled: !operatorId }}
      afterClose={() => setOperatorId(conversation.operatorId)}
      onOk={() => assignConversation(operatorId!)}
      confirmLoading={isUpdating}
    >
      <div className="mb-2">将会话分配给：</div>
      <Select
        showSearch
        size="large"
        options={operatorOptions}
        optionFilterProp="name"
        value={operatorId}
        onChange={setOperatorId}
        style={{ width: '100%' }}
      />
    </Modal>
  );
}
