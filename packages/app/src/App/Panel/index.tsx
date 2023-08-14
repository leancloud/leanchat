import { PropsWithChildren, Suspense, lazy, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot } from 'recoil';
import { Spin } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { MdSettings } from 'react-icons/md';
import { BiSolidInbox } from 'react-icons/bi';
import axios from 'axios';

import { SocketProvider, useSocket } from '@/socket';
import { AuthProvider } from './auth';
import Conversations from './Conversations';
import { Layout } from './Layout';
import { Compose } from './compose';
import { useAutoPushNewMessage, useConversationSubscription } from './hooks/conversation';
import { useAuthContext } from './auth';

const Login = lazy(() => import('./Login'));
const Settings = lazy(() => import('./Settings'));

const navs = [
  {
    to: 'conversations',
    icon: BiSolidInbox,
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
  useConversationSubscription(socket);

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
        navigate('/panel/login');
      }
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
  // https://github.com/ant-design/ant-design/issues/38794
  .push(StyleProvider, { hashPriority: 'high' })
  .push(RecoilRoot)
  .push(PanelQueryClientProvider)
  .assemble();

export default function Panel() {
  return (
    <Root>
      <Suspense fallback={<Fallback />}>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Entry />
                </RequireAuth>
              }
            >
              <Route path="conversations" element={<Conversations />} />
              <Route path="settings/*" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Suspense>
    </Root>
  );
}
