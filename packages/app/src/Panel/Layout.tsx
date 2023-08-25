import { JSXElementConstructor, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { Dropdown } from 'antd';
import { useMutation } from '@tanstack/react-query';

import { callRpc, useSocket } from '@/socket';
import { Avatar } from '@/Panel/components/Avatar';
import { useUserStatus } from './states/user';

interface Nav {
  to: string;
  icon: JSXElementConstructor<{ className?: string }>;
}

function Logo() {
  return (
    <div className="h-[70px] flex">
      <div className="m-auto w-9 leading-9 bg-primary text-center font-mono text-3xl text-white rounded select-none">
        L
      </div>
    </div>
  );
}

export interface LayoutProps {
  navs?: Nav[];
  children?: ReactNode;
}

export function Layout({ navs, children }: LayoutProps) {
  return (
    <div className="h-screen min-w-[1200px] grid grid-cols-[70px_1fr] bg-[#f7f7f7]">
      <div className="flex flex-col border-r border-r-[#ececec]">
        <Logo />
        <hr className="border-t-[#ececec] mx-3 my-2" />
        <div className="grow">{navs?.map((nav) => <Nav key={nav.to} {...nav} />)}</div>
        <hr className="border-t-[#ececec] mx-3 my-2" />
        <div className="h-[60px] flex justify-center items-center mt-auto">
          <User />
        </div>
      </div>
      <div className="grow overflow-hidden">{children}</div>
    </div>
  );
}

function Nav({ icon: Icon, to }: Nav) {
  return (
    <div className="flex h-[70px]">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cx('m-auto p-1', {
            'text-[#3884F7]': isActive,
            'text-[#969696]': !isActive,
          })
        }
      >
        <Icon className="w-[22px] h-[22px]" />
      </NavLink>
    </div>
  );
}

function User() {
  const [status, setStatusState] = useUserStatus();
  const socket = useSocket();

  const { mutate: setStatus } = useMutation({
    mutationFn: async (status: string) => {
      await callRpc(socket, 'setStatus', status);
    },
    onSuccess: (_data, status) => {
      setStatusState(status);
    },
  });
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        onClick: (e) => setStatus(e.key),
        items: [
          {
            key: 'ready',
            name: '在线',
            color: '#34b857',
          },
          {
            key: 'busy',
            name: '忙碌',
            color: '#e81332',
          },
          {
            key: 'leave',
            name: '离开',
            color: '#d7dae1',
          },
        ].map(({ key, name, color }) => ({
          key,
          label: (
            <div className="flex items-center">
              <div
                className="w-[10px] h-[10px] rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              {name}
            </div>
          ),
        })),
      }}
    >
      <button className="relative">
        <Avatar size={32} status={status} />
      </button>
    </Dropdown>
  );
}
