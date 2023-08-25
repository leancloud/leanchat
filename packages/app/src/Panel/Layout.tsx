import { JSXElementConstructor, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { Avatar, Dropdown } from 'antd';
import { useMutation } from '@tanstack/react-query';

import { callRpc, useSocket } from '@/socket';
import { useUserStatus } from './states/user';

interface Nav {
  to: string;
  icon: JSXElementConstructor<{ className?: string }>;
}

function Logo() {
  return (
    <div className="h-[70px] flex">
      <div className="m-auto w-10 leading-10 bg-primary text-center font-mono text-[32px] text-white rounded select-none">
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
        <hr className="border-t-[#ececec] m-3" />
        <div>{navs?.map((nav) => <Nav key={nav.to} {...nav} />)}</div>
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
      menu={{
        onClick: (e) => setStatus(e.key),
        items: [
          {
            key: 'ready',
            label: '在线',
          },
          {
            key: 'busy',
            label: '忙碌',
          },
          {
            key: 'leave',
            label: '离开',
          },
        ],
      }}
    >
      <button className="relative">
        <Avatar />
        <div
          className={cx(
            'w-3 h-3 rounded-full absolute right-0 bottom-0 translate-x-[25%] translate-y-[25%]',
            {
              'bg-[#34b857]': status === 'ready',
              'bg-[#d7dae1]': status === 'leave',
              'bg-[#e81332]': status === 'busy',
            },
          )}
        />
      </button>
    </Dropdown>
  );
}
