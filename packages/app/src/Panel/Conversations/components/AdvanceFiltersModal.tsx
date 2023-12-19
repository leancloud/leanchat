import { useRef } from 'react';
import { Form, FormInstance, Input, Modal } from 'antd';

import { SearchConversationOptions } from '@/Panel/api/conversation';

const idPattern = /^[a-f\d]{24}$/;

interface AdvanceFiltersModalProps {
  open?: boolean;
  onSearch: (options: SearchConversationOptions) => void;
  onCancel: () => void;
}

export function AdvanceFiltersModal({ open, onSearch, onCancel }: AdvanceFiltersModalProps) {
  const formRef = useRef<FormInstance>(null);

  const handleSearch = (data: Record<string, any>) => {
    const options: SearchConversationOptions = {};
    if (data.id) {
      options.id = data.id;
    }
    if (data.visitorId) {
      options.visitorId = [data.visitorId];
    }
    if (data.keyword?.trim()) {
      options.message = {
        text: data.keyword.trim(),
      };
    }
    onSearch(options);
  };

  return (
    <Modal
      open={open}
      title="搜索条件"
      okText="搜索"
      onOk={() => formRef.current?.submit()}
      onCancel={onCancel}
    >
      <Form ref={formRef} layout="vertical" onFinish={handleSearch}>
        <Form.Item label="会话ID" name="id" rules={[{ pattern: idPattern, message: '无效的ID' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="用户ID"
          name="visitorId"
          rules={[{ pattern: idPattern, message: '无效的ID' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="关键词" name="keyword">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
