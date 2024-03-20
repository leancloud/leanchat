import { Fragment } from 'react';
import { BsFillChatLeftDotsFill } from 'react-icons/bs';
import { Button, Checkbox, Form, Input, InputNumber, Select, Spin, message } from 'antd';

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
  const { data, isLoading, update, isUpdating } = useConfig('greetingMessage', {
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
          text: '您好，请问有什么可以帮您？',
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
        extra="用户打开聊天组件，系统将使用此说辞作为欢迎语"
      >
        <Input.TextArea autoSize={{ minRows: 2 }} />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

function NoReadyOperatorMessageConfigForm() {
  const { data, isLoading, update, isUpdating } = useConfig('noReadyOperatorMessage', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form initialValues={data || undefined} onFinish={update}>
      <Form.Item
        wrapperCol={{ offset: 4 }}
        name="text"
        rules={[{ required: true }]}
        extra="用户打开聊天界面时，如果没有处于「在线」状态的客服，将显示此提示语"
      >
        <Input.TextArea autoSize={{ minRows: 2 }} />
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
        <InputNumber min={0} addonAfter="分钟" />
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
        extra="系统关闭会话时将向用户发送此消息"
      >
        <Input.TextArea autoSize={{ minRows: 2 }} />
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
    <Form initialValues={data || undefined} onFinish={update}>
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
        name={['queuedMessage', 'text']}
        rules={[{ required: true }]}
        extra="可使用占位符 {{ queue.position }}"
      >
        <Input.TextArea autoSize={{ minRows: 2 }} />
      </Form.Item>

      <Form.Item
        label="上限提示"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        name={['fullMessage', 'text']}
        rules={[{ required: true }]}
      >
        <Input.TextArea autoSize={{ minRows: 2 }} />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={isUpdating}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}

function EvaluationConfigForm() {
  const { data, isLoading, update, isUpdating } = useConfig('evaluation', {
    onSuccess: () => {
      message.success('已保存');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Form initialValues={data || undefined} onFinish={update}>
      {[
        { key: 'positive', label: '好评选项' },
        { key: 'negative', label: '差评选项' },
      ].map(({ key, label }) => (
        <Fragment key={key}>
          <Form.Item
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 22 }}
            label={label}
            name={['tag', key, 'options']}
            initialValue={[]}
            style={{ marginBottom: 10 }}
          >
            <Select mode="tags" />
          </Form.Item>
          <Form.Item
            wrapperCol={{ offset: 4 }}
            valuePropName="checked"
            name={['tag', key, 'required']}
            initialValue={false}
          >
            <Checkbox>必填</Checkbox>
          </Form.Item>
        </Fragment>
      ))}
      <Form.Item
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 22 }}
        label="超时时间"
        name="timeout"
        extra="会话关闭后，用户仅可在指定时间内进行评价。设为 0 关闭该功能。"
        getValueProps={(value = 0) => ({ value: Math.floor(value / 3600) })}
        getValueFromEvent={(value) => (value ? value * 3600 : 0)}
      >
        <InputNumber min={0} addonAfter="小时" />
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
        {(
          [
            ['欢迎语', GreetingConfigForm],
            ['无客服在线提示语', NoReadyOperatorMessageConfigForm],
            ['自动踢线', AutoCloseConversationForm],
            ['排队设置', QueueConfigForm],
            ['评价设置', EvaluationConfigForm],
          ] as const
        ).map(([title, Form]) => (
          <Fragment key={title}>
            <h2 className="text-base font-medium my-4">{title}</h2>
            <Form />
          </Fragment>
        ))}
      </div>
    </Container>
  );
}
