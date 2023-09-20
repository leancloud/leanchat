import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BsFillChatLeftDotsFill } from 'react-icons/bs';
import { Button, Checkbox, Form, FormInstance, Input } from 'antd';

import { getGreetingConfig, setGreetingConfig } from '@/Panel/api/config';
import { Container } from '../components/Container';

function GreetingConfig() {
  const { data } = useQuery({
    queryKey: ['GreetingConfig'],
    queryFn: getGreetingConfig,
  });

  const set = useMutation({
    mutationFn: setGreetingConfig,
  });

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
      style={{ maxWidth: 800 }}
      onFinish={(data) => {
        set.mutate({
          enabled: !!data.enabled,
          message: {
            text: data.text,
          },
        });
      }}
    >
      <Form.Item
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        name="enabled"
        valuePropName="checked"
        label="欢迎语"
      >
        <Checkbox>开启</Checkbox>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 18 }} name="text" rules={[{ required: true }]}>
        <Input.TextArea rows={5} />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit" loading={set.isLoading}>
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
      <GreetingConfig />
    </Container>
  );
}
