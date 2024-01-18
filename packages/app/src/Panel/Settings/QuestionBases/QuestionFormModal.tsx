import { useRef } from 'react';
import { FormInstance, Modal } from 'antd';

import { QuestionForm, QuestionFormData, QuestionFormProps } from './QuestionForm';

export interface QuestionFormModalProps {
  open?: boolean;
  title?: string;
  onCancel?: () => void;
  onSubmit?: (data: QuestionFormData) => void;
  loading?: boolean;
  initData?: QuestionFormProps['initData'];
}

export function QuestionFormModal({
  open,
  title,
  onCancel,
  onSubmit,
  loading,
  initData,
}: QuestionFormModalProps) {
  const formRef = useRef<FormInstance>(null);

  return (
    <Modal
      width={600}
      open={open}
      title={title}
      onOk={() => formRef.current?.submit()}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <QuestionForm ref={formRef} initData={initData} onSubmit={onSubmit} />
    </Modal>
  );
}
