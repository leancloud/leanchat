import { PropsWithChildren, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Result, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StyleProvider } from '@ant-design/cssinjs';
import { MdSettings } from 'react-icons/md';
import { BiSolidInbox, BiSolidDoughnutChart, BiCheckShield } from 'react-icons/bi';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

import { SocketProvider, useSocket } from '@/socket';
import { AuthProvider, useCurrentUser } from './auth';
import Conversations from './Conversations';
import { Layout, Nav } from './Layout';
import { Compose } from './compose';
import { useAutoPushNewMessage, useSubscribeConversations } from './hooks/conversation';
import { useAuthContext } from './auth';
import { useSubscribeOperatorsStatus } from './hooks/operator';
import { NowProvider } from './contexts/NowContext';
import { OperatorRole } from './types';

const Login = lazy(() => import('./Login'));
const Quality = lazy(() => import('./Statistics/Quality'));
const Statistics = lazy(() => import('./Statistics'));
const Settings = lazy(() => import('./Settings'));

const navs: (Nav & { roles?: OperatorRole[] })[] = [
  {
    to: 'conversations',
    icon: BiSolidInbox,
  },
  {
    to: 'quality',
    icon: BiCheckShield,
    roles: [OperatorRole.Admin, OperatorRole.Inspector],
  },
  {
    to: 'statistics',
    icon: BiSolidDoughnutChart,
    roles: [OperatorRole.Admin, OperatorRole.Inspector],
  },
  {
    to: 'settings',
    icon: MdSettings,
    roles: [OperatorRole.Admin],
  },
];

function Fallback() {
  return (
    <div className="h-screen max-h-full flex">
      <div className="m-auto">
        <Spin />
      </div>
    </div>
  );
}

function SocketSubscription() {
  const socket = useSocket();

  useAutoPushNewMessage(socket);
  useSubscribeConversations(socket);
  useSubscribeOperatorsStatus(socket);

  return null;
}

function RequireAuth({ children }: PropsWithChildren) {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="login" />;
  }

  return children;
}

function RequireRole({ roles, children }: PropsWithChildren<{ roles: OperatorRole[] }>) {
  const user = useCurrentUser();
  if (!roles.includes(user.role)) {
    return <Result status="403" title="未经授权的访问" subTitle="对不起，您没有权限访问此页面。" />;
  }
  return children;
}

function Entry() {
  const user = useCurrentUser();

  return (
    <SocketProvider uri="/o">
      <SocketSubscription />
      <Layout navs={navs.filter((nav) => !nav.roles || nav.roles.includes(user.role))}>
        <Suspense fallback={<Fallback />}>
          <Outlet />
        </Suspense>
      </Layout>
    </SocketProvider>
  );
}

function PanelQueryClientProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();

  const onError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
      message.error(error.response?.data.message);
    }
  };

  const [client] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnReconnect: true,
          refetchOnWindowFocus: false,
          retry: false,
          onError,
        },
        mutations: {
          onError,
        },
      },
    });
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const Root = new Compose()
  .push(BrowserRouter)
  // https://github.com/ant-design/ant-design/issues/38794
  .push(StyleProvider, { hashPriority: 'high' })
  .push(ConfigProvider, { locale: zhCN })
  .push(PanelQueryClientProvider)
  .push(NowProvider, { interval: 1000 * 20 })
  .assemble();

export default function Panel() {
  return (
    <Root>
      <Toaster />
      <Suspense fallback={<Fallback />}>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Entry />
                </RequireAuth>
              }
            >
              <Route path="conversations" element={<Conversations />} />
              <Route path="conversations/:id" element={<Conversations />} />
              <Route
                path="quality/*"
                element={
                  <RequireRole roles={[OperatorRole.Admin, OperatorRole.Inspector]}>
                    <Quality />
                  </RequireRole>
                }
              />
              <Route
                path="statistics/*"
                element={
                  <RequireRole roles={[OperatorRole.Admin, OperatorRole.Inspector]}>
                    <Statistics />
                  </RequireRole>
                }
              />
              <Route
                path="settings/*"
                element={
                  <RequireRole roles={[OperatorRole.Admin]}>
                    <Settings />
                  </RequireRole>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </Suspense>
    </Root>
  );
}
