import { forwardRef } from 'react';
import { Button, Form, FormInstance, Input } from 'antd';

export interface QuestionBaseFormData {
  name: string;
}

export interface QuestionBaseFormProps {
  initData?: Partial<QuestionBaseFormData>;
  onSubmit?: (data: QuestionBaseFormData) => void;
  submitButton?:
    | {
        text?: string;
      }
    | false;
}

export const QuestionBaseForm = forwardRef<FormInstance, QuestionBaseFormProps>(
  ({ initData, onSubmit, submitButton = {} }, ref) => {
    return (
      <Form ref={ref} layout="vertical" initialValues={initData} onFinish={onSubmit}>
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {submitButton && (
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {submitButton.text || '保存'}
            </Button>
          </Form.Item>
        )}
      </Form>
    );
  },
);
