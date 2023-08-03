import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdGroup, MdPersonAddAlt1, MdPerson } from 'react-icons/md';
import { Alert, Button, Form, Input, InputNumber, Table, message } from 'antd';

import {
  createOperator,
  getOperator,
  getOperators,
  updateOperator,
} from '@/App/Panel/api/operator';
import { Container } from '../components/Container';

export function Operators() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState<number>();

  const { data, isLoading } = useQuery({
    queryKey: ['Operators', page, pageSize],
    queryFn: async () => {
      const { items, count } = await getOperators({ page, pageSize });
      setTotal(count);
      return items;
    },
  });

  return (
    <Container
      header={{
        Icon: MdGroup,
        title: '客服',
        extra: (
          <Link to="new">
            <Button type="primary">添加客服</Button>
          </Link>
        ),
      }}
    >
      <Table
        loading={isLoading}
        dataSource={data}
        rowKey="id"
        pagination={{
          pageSize,
          total,
          current: page,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        columns={[
          {
            dataIndex: 'username',
            title: '用户名',
          },
          {
            dataIndex: 'externalName',
            title: '外部名称',
          },
          {
            dataIndex: 'internalName',
            title: '内部名称',
          },
          {
            key: 'actions',
            width: 200,
            render: (operator) => <Link to={operator.id}>编辑</Link>,
          },
        ]}
      />
    </Container>
  );
}

export function NewOperator() {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { mutate, isLoading, error } = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries(['Operators']);
      message.success('已添加');
      navigate('..');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPersonAddAlt1,
        title: '添加客服',
      }}
    >
      {(error as Error | null) && (
        <Alert
          type="error"
          message={(error as Error).message}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        autoComplete="off"
        initialValues={{ concurrency: 5 }}
        onFinish={(data) => mutate(data)}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true }, { min: 6, max: 24 }, { pattern: /[0-9a-zA-Z_]/ }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="密码" name="password" rules={[{ required: true, min: 6, max: 64 }]}>
          <Input.Password />
        </Form.Item>

        <Form.Item label="外部名称" name="externalName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="内部名称" name="internalName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="同时接待量"
          name="concurrency"
          rules={[{ required: true, type: 'integer', min: 0 }]}
        >
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            添加
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
}

export function EditOperator() {
  const { id } = useParams();

  const { data, isFetching } = useQuery({
    enabled: !!id,
    queryKey: ['Operator', id],
    queryFn: () => getOperator(id!),
  });

  const {
    mutate,
    isLoading: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: updateOperator,
    onSuccess: () => {
      message.success('已保存');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPerson,
        title: '编辑客服',
      }}
      loading={isFetching}
    >
      {(updateError as Error | null) && (
        <Alert
          type="error"
          message={(updateError as Error).message}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        autoComplete="off"
        initialValues={data}
        onFinish={(data) => {
          mutate({
            id: id!,
            password: data.password || undefined,
            externalName: data.externalName,
            internalName: data.internalName,
            concurrency: data.concurrency,
          });
        }}
      >
        <Form.Item label="用户名" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item label="密码" name="password" rules={[{ min: 6, max: 64 }]}>
          <Input.Password placeholder="修改密码" />
        </Form.Item>

        <Form.Item label="外部名称" name="externalName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="内部名称" name="internalName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="同时接待量"
          name="concurrency"
          rules={[{ required: true, type: 'integer', min: 0 }]}
        >
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isUpdating}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
}
