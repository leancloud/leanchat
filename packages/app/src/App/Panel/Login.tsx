import { Controller, useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { Button, Form, Input } from 'antd';
import AV from 'leancloud-storage';

import { useAuth } from './auth';

AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_API_SERVER,
});

interface LoginData {
  email: string;
  password: string;
}

export default function Login() {
  const { user, setUser } = useAuth();
  const { control, handleSubmit, setError } = useForm<LoginData>();

  const _handleSubmit = ({ email, password }: LoginData) => {
    AV.User.loginWithEmail(email, password)
      .then((user) => setUser({ id: user.id!, sessionToken: user.getSessionToken() }))
      .catch((error: Error) => setError('password', { message: error.message }));
  };

  if (user) {
    return <Navigate to=".." />;
  }

  return (
    <div className="h-screen flex">
      <div className="m-auto w-[280px]">
        <div className="text-primary text-4xl text-center font-bold mb-5">LeanChat</div>
        <Form onFinish={handleSubmit(_handleSubmit)}>
          <Controller
            control={control}
            name="email"
            rules={{ required: true }}
            render={({ field, fieldState: { error } }) => (
              <Form.Item validateStatus={error ? 'error' : undefined} help={error?.message}>
                <Input {...field} size="large" placeholder="Email" autoFocus />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="password"
            rules={{ required: true }}
            render={({ field, fieldState: { error } }) => (
              <Form.Item validateStatus={error ? 'error' : undefined} help={error?.message}>
                <Input.Password {...field} size="large" placeholder="Password" />
              </Form.Item>
            )}
          />
          <div className="flex items-center">
            <button
              className="text-gray-400 mr-auto"
              type="button"
              onClick={() => alert('hahahaha')}
            >
              Forgot password?
            </button>
            <Button type="primary" htmlType="submit">
              Login
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
