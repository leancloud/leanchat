import { forwardRef } from 'react';
import { Button, Checkbox, Form, FormInstance, Input, Select } from 'antd';
import _ from 'lodash';

import { useChatbotQuestionBases } from '@/Panel/hooks/chatbot';

export interface QuestionFormData {
  matcher: number;
  question: string;
  similarQuestions?: string[];
  answer: {
    text: string;
  };
  nextQuestionBaseId?: string;
  assignOperator?: boolean;
}

export interface QuestionFormProps {
  initData?: Partial<QuestionFormData>;
  onSubmit?: (data: QuestionFormData) => void;
}

export const QuestionForm = forwardRef<FormInstance, QuestionFormProps>(
  ({ initData, onSubmit }, ref) => {
    const [form] = Form.useForm<QuestionFormData>();

    const { data: questionBases } = useChatbotQuestionBases();

    return (
      <Form ref={ref} form={form} layout="vertical" initialValues={initData} onFinish={onSubmit}>
        <Form.Item name="matcher" label="匹配规则" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '完全匹配', value: 1 },
              { label: '包含匹配', value: 2 },
            ]}
          />
        </Form.Item>

        <Form.Item name="question" label="标准问法" initialValue="">
          <Input placeholder="包含匹配 + 留空 = 匹配任何内容" />
        </Form.Item>

        <Form.Item label="相似问法">
          <Form.List name="similarQuestions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div key={field.key} className="flex items-center gap-2 mb-2">
                    <Form.Item
                      {...field}
                      noStyle
                      messageVariables={{ index: (index + 1).toString() }}
                      rules={[{ required: true, message: '请填写相似问法 ${index}' }]}
                    >
                      <Input placeholder={`相似问法 ${index + 1}`} />
                    </Form.Item>
                    <Button size="small" onClick={() => remove(index)}>
                      -
                    </Button>
                  </div>
                ))}
                <Button onClick={() => add('')}>添加</Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item name={['answer', 'text']} label="回答" rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>

        <Form.Item name="nextQuestionBaseId" label="切换问题库">
          <Select allowClear options={questionBases} fieldNames={{ label: 'name', value: 'id' }} />
        </Form.Item>

        <Form.Item name="assignOperator" valuePropName="checked">
          <Checkbox>分配人工客服</Checkbox>
        </Form.Item>
      </Form>
    );
  },
);
