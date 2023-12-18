import { useState } from 'react';
import { Button, Modal } from 'antd';

import { CategoryCascader } from '@/Panel/components/CategoryCascader';

export interface CloseConfirmProps {
  open?: boolean;
  onClose: (categoryId?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CloseConfirm({ open, onCancel, onClose, loading }: CloseConfirmProps) {
  const [categoryId, setCategoryId] = useState<string>();

  return (
    <Modal
      title="关闭会话"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={() => onClose()} disabled={loading}>
          直接关闭
        </Button>,
        <Button
          key="setCategoryAndClose"
          type="primary"
          disabled={!categoryId}
          onClick={() => onClose(categoryId)}
          loading={loading}
        >
          设置分类并关闭
        </Button>,
      ]}
    >
      <CategoryCascader
        placeholder="请选择分类"
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        style={{ width: '100%' }}
      />
    </Modal>
  );
}
