import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FormInstance, Modal } from 'antd';

import { ChatbotForm, ChatbotFormData, ChatbotFormProps } from './ChatbotForm';

interface OpenOptions {
  initData?: ChatbotFormProps['initData'];
}

export interface ChatbotFormModalRef {
  open: (options?: OpenOptions) => void;
  close: () => void;
}

export interface ChatbotFormModalProps {
  title?: string;
  onSubmit?: (data: ChatbotFormData) => void;
  loading?: boolean;
}

export const ChatbotFormModal = forwardRef<ChatbotFormModalRef, ChatbotFormModalProps>(
  ({ title, onSubmit, loading }, ref) => {
    const [open, setOpen] = useState(false);
    const [initData, setInitData] = useState<ChatbotFormProps['initData']>();

    useImperativeHandle(ref, () => ({
      open: ({ initData } = {}) => {
        setOpen(true);
        setInitData(initData);
      },
      close: () => setOpen(false),
    }));

    const formRef = useRef<FormInstance>(null);

    return (
      <Modal
        destroyOnClose
        width={650}
        title={title}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => formRef.current?.submit()}
        confirmLoading={loading}
      >
        <ChatbotForm ref={formRef} initData={initData} onSubmit={onSubmit} />
      </Modal>
    );
  },
);
