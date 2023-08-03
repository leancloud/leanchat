import { PropsWithChildren, Suspense, lazy, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot } from 'recoil';
import { Spin } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { MdSettings } from 'react-icons/md';
import { BiSolidInbox } from 'react-icons/bi';
import axios from 'axios';

// import { SocketProvider } from '@/socket';
import { AuthProvider, useAuth } from './auth';
// import Conversations from './Conversations';
import { Layout } from './Layout';
import { Compose } from './compose';

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

function Center({ children }: PropsWithChildren) {
  return (
    <div className="h-screen flex">
      <div className="m-auto">{children}</div>
    </div>
  );
}

function Entry() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="login" />;
  }

  return (
    <Layout navs={navs}>
      <Suspense fallback={<Center children={<Spin />} />}>
        <Outlet />
      </Suspense>
    </Layout>
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
      <Suspense fallback={<Center children={<Spin />} />}>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="*" element={<Entry />}>
              {/* <Route path="conversations" element={<Conversations />} /> */}
              <Route path="settings/*" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Suspense>
    </Root>
  );
}
