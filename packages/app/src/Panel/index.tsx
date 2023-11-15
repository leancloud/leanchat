import { PropsWithChildren, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StyleProvider } from '@ant-design/cssinjs';
import { MdSettings } from 'react-icons/md';
import { BiSolidInbox, BiSolidDoughnutChart, BiCheckShield } from 'react-icons/bi';
import axios from 'axios';

import { SocketProvider, useSocket } from '@/socket';
import { AuthProvider } from './auth';
import Conversations from './Conversations';
import { Layout } from './Layout';
import { Compose } from './compose';
import { useAutoPushNewMessage, useSubscribeConversations } from './hooks/conversation';
import { useAuthContext } from './auth';
import { useSubscribeOperatorsStatus } from './hooks/operator';
import { NowProvider } from './contexts/NowContext';

const Login = lazy(() => import('./Login'));
const Quality = lazy(() => import('./Statistics/Quality'));
const Statistics = lazy(() => import('./Statistics'));
const Settings = lazy(() => import('./Settings'));

const navs = [
  {
    to: 'conversations',
    icon: BiSolidInbox,
  },
  {
    to: 'quality',
    icon: BiCheckShield,
  },
  {
    to: 'statistics',
    icon: BiSolidDoughnutChart,
  },
  {
    to: 'settings',
    icon: MdSettings,
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

function Entry2() {
  const socket = useSocket();

  useAutoPushNewMessage(socket);
  useSubscribeConversations(socket);
  useSubscribeOperatorsStatus(socket);

  return <Outlet />;
}

function RequireAuth({ children }: PropsWithChildren) {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="login" />;
  }

  return children;
}

function Entry() {
  return (
    <SocketProvider uri="/o">
      <Layout navs={navs}>
        <Suspense fallback={<Fallback />}>
          <Entry2 />
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
              <Route path="quality/*" element={<Quality />} />
              <Route path="statistics/*" element={<Statistics />} />
              <Route path="settings/*" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Suspense>
    </Root>
  );
}
