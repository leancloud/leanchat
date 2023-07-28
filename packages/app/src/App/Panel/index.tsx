import { PropsWithChildren, Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { StyleProvider } from '@ant-design/cssinjs';

import { SocketProvider } from '@/socket';
import { AuthProvider, useAuth } from './auth';
import Conversations from './Conversations';
import { Layout } from './Layout';
import { Compose } from './compose';

const Login = lazy(() => import('./Login'));

const navs = [
  {
    to: 'conversations',
    icon: InboxOutlined,
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
    <SocketProvider
      auth={{ type: 'operator', sessionToken: user.id }}
      fallback={<Center>Connecting...</Center>}
    >
      <Layout navs={navs}>
        <Outlet />
      </Layout>
    </SocketProvider>
  );
}

const Root = new Compose()
  // https://github.com/ant-design/ant-design/issues/38794
  .push(StyleProvider, { hashPriority: 'high' })
  .push(RecoilRoot)
  .push(AuthProvider)
  .assemble();

export default function Panel() {
  return (
    <Root>
      <Suspense fallback={<Center children={<Spin />} />}>
        <Routes>
          <Route path="*" element={<Entry />}>
            <Route path="conversations" element={<Conversations />} />
          </Route>
          <Route path="login" element={<Login />} />
        </Routes>
      </Suspense>
    </Root>
  );
}
