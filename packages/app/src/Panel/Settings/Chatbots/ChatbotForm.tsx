import { forwardRef, useState } from 'react';
import { Checkbox, Form, FormInstance, Input, Select, TimePicker, Transfer } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';

import { ChatbotMessage } from '@/Panel/types';
import { useChatbotQuestionBases } from '@/Panel/hooks/chatbot';

export interface ChatbotFormData {
  name: string;
  acceptRule?: number;
  workingTime?: {
    start: number;
    end: number;
  };
  globalQuestionBaseIds?: string[];
  initialQuestionBaseIds?: string[];
  greetingMessage: ChatbotMessage;
  noMatchMessage: ChatbotMessage;
}

interface ChatbotFormInternalData extends Omit<ChatbotFormData, 'workingTime'> {
  workingTime?: {
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
  };
}

export interface ChatbotFormProps {
  initData?: Partial<ChatbotFormData>;
  onSubmit?: (data: ChatbotFormData) => void;
}

export const ChatbotForm = forwardRef<FormInstance, ChatbotFormProps>(
  ({ initData, onSubmit }, ref) => {
    const { data: questionBases } = useChatbotQuestionBases();

    const [parsedInitData] = useState<Partial<ChatbotFormInternalData> | undefined>(() => {
      if (initData) {
        return {
          ...initData,
          workingTime: initData.workingTime && {
            start: dayjs().startOf('day').add(initData.workingTime.start, 'ms'),
            end: dayjs().startOf('day').add(initData.workingTime.end, 'ms'),
          },
        };
      }
    });

    const [enableWorkingTime, setEnableWorkingTime] = useState(!!parsedInitData?.workingTime);

    const handleSubmit = (data: ChatbotFormInternalData) => {
      onSubmit?.({
        ...data,
        workingTime: data.workingTime && {
          start: data.workingTime.start.startOf('minute').diff(dayjs().startOf('day'), 'ms'),
          end: data.workingTime.end.endOf('minute').diff(dayjs().startOf('day'), 'ms'),
        },
      });
    };

    return (
      <Form ref={ref} layout="vertical" initialValues={parsedInitData} onFinish={handleSubmit}>
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

        <Form.Item label="工作时间" extra="仅在指定时间范围内接待用户">
          <div className="flex items-center h-10 gap-2">
            <Checkbox
              checked={enableWorkingTime}
              onChange={(e) => setEnableWorkingTime(e.target.checked)}
            >
              开启
            </Checkbox>
            {enableWorkingTime && (
              <>
                <Form.Item
                  noStyle
                  name={['workingTime', 'start']}
                  rules={[{ required: true }]}
                  label="开始时间"
                >
                  <TimePicker format="HH:mm" placeholder="开始时间" />
                </Form.Item>
                <Form.Item
                  noStyle
                  name={['workingTime', 'end']}
                  rules={[{ required: true }]}
                  label="结束时间"
                >
                  <TimePicker format="HH:mm" placeholder="结束时间" />
                </Form.Item>
              </>
            )}
          </div>
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
