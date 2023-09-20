import { useEffect, useRef } from 'react';
import { BsFillChatLeftDotsFill } from 'react-icons/bs';
import { Button, Checkbox, Form, FormInstance, Input, InputNumber } from 'antd';

import { AutoCloseConversationConfig, GreetingConfig } from '@/Panel/api/config';
import { Container } from '../components/Container';
import { useConfig } from '@/Panel/hooks/config';

function GreetingConfigForm() {
  const { data, update, isUpdating } = useConfig<GreetingConfig>('greeting');

  const formRef = useRef<FormInstance>(null!);

  useEffect(() => {
    if (data) {
      formRef.current.setFieldsValue({
        enabled: data.enabled,
        text: data.message.text,
      });
    }
  }, [data]);

  return (
    <Form
      ref={formRef}
      onFinish={(data) => {
        update({
          enabled: !!data.enabled,
          message: {
            text: data.text,
          },
        });
      }}
    >
      <Form.Item wrapperCol={{ offset: 4 }} name="enabled" valuePropName="checked">
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name="text"
        rules={[{ required: true }]}
        extra="开启后，用户打开聊天组件，系统将使用此说辞作为欢迎语"
      >
        <Input.TextArea rows={5} />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

function AutoCloseConversationForm() {
  const { data, update, isUpdating } =
    useConfig<AutoCloseConversationConfig>('autoCloseConversation');

  const formRef = useRef<FormInstance>(null!);

  useEffect(() => {
    formRef.current.setFieldsValue({
      timeout: data ? Math.floor(data.timeout / 60) : 0,
    });
  }, [data]);

  return (
    <Form ref={formRef} onFinish={(data) => update({ timeout: data.timeout * 60 })}>
      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="超时时间"
        name="timeout"
        rules={[{ required: true }]}
        extra="客服回复后，用户在指定时间内未进行操作，系统自动关闭会话。设为 0 关闭该功能"
      >
        <InputNumber min={0} suffix="分钟" />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

export function ChatConfig() {
  return (
    <Container
      header={{
        Icon: BsFillChatLeftDotsFill,
        title: '聊天设置',
      }}
    >
      <div className="max-w-[800px]">
        <h2 className="text-base font-medium">欢迎语</h2>
        <GreetingConfigForm />

        <h2 className="text-base font-medium my-4">自动踢线</h2>
        <AutoCloseConversationForm />
      </div>
    </Container>
  );
}
