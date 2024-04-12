import { ReactNode, forwardRef, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdGroup, MdPersonAddAlt1, MdPerson } from 'react-icons/md';
import {
  Alert,
  Button,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  message,
} from 'antd';
import { useToggle } from 'react-use';

import { createOperator, getOperator, updateOperator } from '@/Panel/api/operator';
import { useOperators } from '@/Panel/hooks/operator';
import { Operator, OperatorRole } from '@/Panel/types';
import { Container } from '../components/Container';

export function Operators() {
  const [inactive, setInactive] = useState(false);
  const { data, isLoading } = useOperators({ inactive });

  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: updateOperator,
    onSuccess: () => {
      queryClient.invalidateQueries(['Operators']);
    },
  });

  const handleChangeInactive = (operator: Operator) => {
    if (operator.inactive) {
      mutateAsync({ id: operator.id, inactive: false });
    } else {
      Modal.confirm({
        title: `禁用客服 - ${operator.internalName}`,
        content: '禁用后客服将被强制下线且无法继续登录，请确保该客服没有进行中的会话',
        okText: '禁用',
        okButtonProps: { danger: true },
        onOk: () => mutateAsync({ id: operator.id, inactive: true }),
      });
    }
  };

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
      <div className="px-2 mb-5">
        <Radio.Group
          optionType="button"
          options={[
            { label: '启用中', value: false },
            { label: '禁用中', value: true },
          ]}
          value={inactive}
          onChange={(e) => setInactive(e.target.value)}
        />
      </div>

      <Table
        loading={isLoading}
        dataSource={data}
        rowKey="id"
        pagination={false}
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
            dataIndex: 'role',
            title: '角色',
            render: (role: OperatorRole) =>
              ({
                [OperatorRole.Operator]: '客服',
                [OperatorRole.Admin]: '管理员',
                [OperatorRole.Inspector]: '质检',
              })[role],
          },
          {
            key: 'actions',
            width: 200,
            render: (operator: Operator) => (
              <div className="space-x-2">
                <Link to={operator.id}>编辑</Link>
                {operator.inactive ? (
                  <a onClick={() => handleChangeInactive(operator)}>启用</a>
                ) : (
                  <a className="!text-red-500" onClick={() => handleChangeInactive(operator)}>
                    禁用
                  </a>
                )}
              </div>
            ),
          },
        ]}
      />
    </Container>
  );
}

interface OperatorFormData {
  username: string;
  password: string;
  role: number;
  externalName: string;
  internalName: string;
  concurrency: number;
}

interface OperatorFormProps {
  initData?: Partial<OperatorFormData>;
  usernameDisabled?: boolean;
  passwordField?: boolean;
  onSubmit: (data: OperatorFormData) => void;
  submitting?: boolean;
  submitButtonText?: string;
  actions?: ReactNode;
}

function OperatorForm({
  initData,
  usernameDisabled,
  passwordField = true,
  onSubmit,
  submitting,
  submitButtonText = '保存',
  actions,
}: OperatorFormProps) {
  return (
    <Form
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      autoComplete="off"
      initialValues={initData}
      onFinish={onSubmit}
    >
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: !usernameDisabled }, { min: 6, max: 24 }, { pattern: /[0-9a-zA-Z_]/ }]}
      >
        <Input disabled={usernameDisabled} />
      </Form.Item>

      {passwordField && (
        <Form.Item label="密码" name="password" rules={[{ required: true, min: 6, max: 64 }]}>
          <Input.Password />
        </Form.Item>
      )}

      <Form.Item label="角色" name="role">
        <Select
          options={[
            { label: '客服', value: OperatorRole.Operator },
            { label: '管理员', value: OperatorRole.Admin },
            { label: '质检', value: OperatorRole.Inspector },
          ]}
        />
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
        <div className="flex flex-wrap gap-2">
          <Button type="primary" htmlType="submit" loading={submitting}>
            {submitButtonText}
          </Button>
          {actions}
        </div>
      </Form.Item>
    </Form>
  );
}

interface ChangePasswordFormData {
  password: string;
}

interface ChangePasswordFormProps {
  onSubmit?: (data: ChangePasswordFormData) => void;
}

const ChangePasswordForm = forwardRef<FormInstance, ChangePasswordFormProps>(
  ({ onSubmit }, ref) => {
    const [password, setPassword] = useState('');

    return (
      <Form ref={ref} onFinish={onSubmit}>
        <Form.Item name="password" rules={[{ required: true }]}>
          <Input
            placeholder="新密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>
      </Form>
    );
  },
);

interface ChangePasswordModalProps {
  open?: boolean;
  onCancel?: () => void;
  onSubmit?: (data: ChangePasswordFormData) => void;
  loading?: boolean;
}

function ChangePasswordModal({ open, onSubmit, onCancel, loading }: ChangePasswordModalProps) {
  const formRef = useRef<FormInstance>(null!);

  return (
    <Modal
      open={open}
      title="修改密码"
      onCancel={onCancel}
      onOk={() => formRef.current.submit()}
      confirmLoading={loading}
    >
      <ChangePasswordForm ref={formRef} onSubmit={onSubmit} />
    </Modal>
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
      <OperatorForm
        initData={{
          role: OperatorRole.Operator,
          concurrency: 5,
        }}
        onSubmit={mutate}
        submitButtonText="添加"
        submitting={isLoading}
      />
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

  const queryClient = useQueryClient();

  const {
    mutate,
    mutateAsync,
    isLoading: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: updateOperator,
    onSuccess: () => {
      queryClient.invalidateQueries(['Operator', id]);
      queryClient.invalidateQueries(['Operators']);
      message.success('已保存');
    },
  });

  const [changePasswordModalOpen, toggleChangePasswordModal] = useToggle(false);

  const handleChangePassword = async (password: string) => {
    if (id) {
      await mutateAsync({ id, password });
    }
    toggleChangePasswordModal(false);
  };

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
      <OperatorForm
        initData={data}
        usernameDisabled
        passwordField={false}
        submitting={isUpdating}
        onSubmit={(data) => {
          mutate({
            id: id!,
            password: data.password || undefined,
            role: data.role,
            externalName: data.externalName,
            internalName: data.internalName,
            concurrency: data.concurrency,
          });
        }}
        actions={<Button onClick={() => toggleChangePasswordModal()}>修改密码</Button>}
      />

      <ChangePasswordModal
        open={changePasswordModalOpen}
        onCancel={toggleChangePasswordModal}
        onSubmit={({ password }) => handleChangePassword(password)}
        loading={isUpdating}
      />
    </Container>
  );
}
