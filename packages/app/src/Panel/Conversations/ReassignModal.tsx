import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal, Select, SelectProps } from 'antd';

import { useOperators } from '../hooks/operator';
import { Avatar } from '../components/Avatar';
import { assignconversation } from '../api/conversation';
import { useConversationContext } from './contexts/ConversationContext';

interface ReassignModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReassignModal({ open, onClose }: ReassignModalProps) {
  const { conversation } = useConversationContext();
  const [operatorId, setOperatorId] = useState(conversation.operatorId);

  const { data: operators } = useOperators({ inactive: false });

  const operatorOptions = useMemo<SelectProps['options']>(() => {
    return operators?.map((o) => ({
      label: (
        <div className="flex items-center">
          <Avatar size={24} user={o} />
          <div className="ml-2">{o.internalName}</div>
        </div>
      ),
      name: o.internalName,
      value: o.id,
      disabled: o.status !== 1,
    }));
  }, [operators]);

  const { mutate: _assignConversation, isLoading: isUpdating } = useMutation({
    mutationFn: (operatorId: string) => {
      return assignconversation(conversation.id, operatorId);
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
      onOk={() => _assignConversation(operatorId!)}
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
