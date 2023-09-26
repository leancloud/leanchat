import { BsFillChatLeftDotsFill } from 'react-icons/bs';
import { Button, Checkbox, Form, Input, InputNumber, Spin, message } from 'antd';

import { useConfig } from '@/Panel/hooks/config';
import { Container } from '../components/Container';

function Loading() {
  return (
    <div className="w-full h-[200px] flex justify-center items-center">
      <Spin />
    </div>
  );
}

function GreetingConfigForm() {
  const { data, isLoading, update, isUpdating } = useConfig('greeting', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form
      initialValues={
        data || {
          enabled: false,
          message: {
            text: '您好，请问有什么可以帮您？',
          },
        }
      }
      onFinish={update}
    >
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name="enabled"
        valuePropName="checked"
        style={{ marginBottom: 10 }}
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name={['message', 'text']}
        rules={[{ required: true }]}
        extra="开启后，用户打开聊天组件，系统将使用此说辞作为欢迎语"
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

function OperatorWelcomeMessageConfigForm() {
  const { data, isLoading, update, isUpdating } = useConfig('operatorWelcomeMessage', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form
      initialValues={
        data || {
          enabled: false,
          text: '客服 {{ operator.name }} 为您服务',
        }
      }
      onFinish={update}
    >
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name="enabled"
        valuePropName="checked"
        style={{ marginBottom: 10 }}
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name="text"
        rules={[{ required: true }]}
        extra="客服加入会话后，将自动发送该欢迎语。可使用占位符 {{ operator.name }}"
      >
        <Input.TextArea rows={3} />
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
  const { data, isLoading, update, isUpdating } = useConfig('autoClose', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form
      initialValues={
        data
          ? {
              ...data,
              timeout: Math.floor(data.timeout / 60),
            }
          : {
              timeout: 0,
              message: {
                enabled: false,
                text: '由于您长时间未回复，系统关闭了该会话',
              },
            }
      }
      onFinish={(data) =>
        update({
          ...data,
          timeout: data.timeout * 60,
        })
      }
    >
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
      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="提示消息"
        name={['message', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 10 }}
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name={['message', 'text']}
        rules={[{ required: true }]}
        extra="开启后，系统关闭会话时将向用户发送此消息"
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

function QueueConfigForm() {
  const { data, isLoading, update, isUpdating } = useConfig('queue', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form
      initialValues={
        data || {
          capacity: 0,
          queuedMessage: {
            enabled: false,
            text: '您已进入排队系统，当前人数 {{ queue.length }}，您排在第 {{ queue.position }} 位。',
          },
          fullMessage: {
            enabled: false,
            text: '您好，当前排队人数较多，请您稍后再试。',
          },
        }
      }
      onFinish={update}
    >
      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="排队上限"
        name="capacity"
        extra="设为 0 关闭该功能"
        rules={[{ required: true }]}
      >
        <InputNumber />
      </Form.Item>

      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="排队提示"
        name={['queuedMessage', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 10 }}
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name={['queuedMessage', 'text']}
        rules={[{ required: true }]}
        extra="可使用占位符 {{ queue.position }}"
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="上限提示"
        name={['fullMessage', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 10 }}
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name={['fullMessage', 'text']}
        rules={[{ required: true }]}
      >
        <Input.TextArea rows={3} />
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

        <h2 className="text-base font-medium my-4">人工客服欢迎语</h2>
        <OperatorWelcomeMessageConfigForm />

        <h2 className="text-base font-medium my-4">自动踢线</h2>
        <AutoCloseConversationForm />

        <h2 className="text-base font-medium my-4">排队设置</h2>
        <QueueConfigForm />
      </div>
    </Container>
  );
}
