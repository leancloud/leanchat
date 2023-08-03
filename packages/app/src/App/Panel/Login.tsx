import { Controller, useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input } from 'antd';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from './auth';
import { createSession } from './api/session';

interface LoginData {
  username: string;
  password: string;
}

export default function Login() {
  const { user, setUser } = useAuth();
  const { control, handleSubmit } = useForm<LoginData>();
  const navigate = useNavigate();

  const {
    mutate: login,
    error,
    isLoading,
  } = useMutation({
    mutationFn: ({ username, password }: LoginData) => {
      return createSession(username, password);
    },
    onSuccess: (user) => {
      setUser(user);
      navigate('..');
    },
  });

  if (user) {
    return <Navigate to=".." />;
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="m-auto bg-white p-8 rounded-md shadow-md">
        <div className="w-[280px]">
          <div className="text-primary text-4xl text-center font-bold mb-8">LeanChat</div>

          {(error as Error | null) && (
            <Alert
              type="error"
              message={(error as Error).message}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form onFinish={handleSubmit((data) => login(data))}>
            <Controller
              control={control}
              name="username"
              rules={{ required: true }}
              render={({ field, fieldState: { error } }) => (
                <Form.Item validateStatus={error ? 'error' : undefined} help={error?.message}>
                  <Input {...field} size="large" placeholder="用户名" autoFocus />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field, fieldState: { error } }) => (
                <Form.Item validateStatus={error ? 'error' : undefined} help={error?.message}>
                  <Input.Password {...field} size="large" placeholder="密码" />
                </Form.Item>
              )}
            />

            <Button
              className="w-full"
              size="large"
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              登录
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
