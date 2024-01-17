import { useRef } from 'react';
import { FormInstance, Modal } from 'antd';

import { QuestionBaseForm, QuestionBaseFormData } from './QuestionBaseForm';

interface QuestionBaseFormModalProps {
  open?: boolean;
  onCancel: () => void;
  onSubmit: (data: QuestionBaseFormData) => void;
  loading?: boolean;
}

export function QuestionBaseFormModal({
  open,
  onCancel,
  onSubmit,
  loading,
}: QuestionBaseFormModalProps) {
  const formRef = useRef<FormInstance>(null);

  return (
    <Modal
      destroyOnClose
      open={open}
      title="创建问题库"
      onOk={() => formRef.current?.submit()}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <QuestionBaseForm ref={formRef} onSubmit={onSubmit} submitButton={false} />
    </Modal>
  );
}
