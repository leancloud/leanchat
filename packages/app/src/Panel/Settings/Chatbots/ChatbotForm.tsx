import { forwardRef } from 'react';
import { Form, FormInstance, Input, Select, Transfer } from 'antd';
import _ from 'lodash';

import { ChatbotMessage } from '@/Panel/types';
import { useChatbotQuestionBases } from '@/Panel/hooks/chatbot';

export interface ChatbotFormData {
  name: string;
  acceptRule?: number;
  globalQuestionBaseIds?: string[];
  initialQuestionBaseIds?: string[];
  greetingMessage: ChatbotMessage;
  noMatchMessage: ChatbotMessage;
}

export interface ChatbotFormProps {
  initData?: Partial<ChatbotFormData>;
  onSubmit?: (data: ChatbotFormData) => void;
}

export const ChatbotForm = forwardRef<FormInstance, ChatbotFormProps>(
  ({ initData, onSubmit }, ref) => {
    const { data: questionBases } = useChatbotQuestionBases();

    return (
      <Form ref={ref} layout="vertical" initialValues={initData} onFinish={onSubmit}>
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="acceptRule" label="接待规则">
          <Select
            allowClear
            options={[
              { label: '全部会话', value: 1 },
              { label: '排队会话', value: 2 },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="globalQuestionBaseIds"
          label="全局问题库"
          extra="机器人总会在全局问题库中检索问题。全局问题库拥有更高的优先级且不进行切换"
          valuePropName="targetKeys"
          getValueFromEvent={(targetKeys: string, direction: string, moveKeys: string) => {
            if (direction === 'right') {
              // ensure moveKeys at bottom
              return _.difference(targetKeys, moveKeys).concat(moveKeys);
            }
            return targetKeys;
          }}
        >
          <Transfer
            dataSource={questionBases}
            rowKey={(qb) => qb.id}
            render={(qb) => qb.name}
            listStyle={{ flexGrow: 1 }}
          />
        </Form.Item>

        <Form.Item
          name="initialQuestionBaseIds"
          label="初始问题库"
          valuePropName="targetKeys"
          getValueFromEvent={(targetKeys: string, direction: string, moveKeys: string) => {
            if (direction === 'right') {
              // ensure moveKeys at bottom
              return _.difference(targetKeys, moveKeys).concat(moveKeys);
            }
            return targetKeys;
          }}
        >
          <Transfer
            dataSource={questionBases}
            rowKey={(qb) => qb.id}
            render={(qb) => qb.name}
            listStyle={{ flexGrow: 1 }}
          />
        </Form.Item>

        <Form.Item name={['greetingMessage', 'text']} label="初始消息" rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 2 }} placeholder="机器人接入后立即发送此消息" />
        </Form.Item>

        <Form.Item
          name={['noMatchMessage', 'text']}
          label="未匹配消息"
          rules={[{ required: true }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 2 }}
            placeholder="未匹配问题库中任何问题时将发送此消息"
          />
        </Form.Item>
      </Form>
    );
  },
);
