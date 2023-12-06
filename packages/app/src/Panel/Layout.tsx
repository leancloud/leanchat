import { JSXElementConstructor, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { Dropdown } from 'antd';

import { Avatar } from '@/Panel/components/Avatar';
import { setStatus } from './api/operator';
import { useCurrentUser } from './auth';
import { deleteSession } from './api/session';

export interface Nav {
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
      <div className="grow overflow-y-hidden">{children}</div>
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
  const user = useCurrentUser();

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'info',
            label: user.internalName,
          },
          {
            key: 'changeStatus',
            label: '修改状态',
            onClick: (e) => {
              setStatus(parseInt(e.key));
            },
            children: [
              {
                key: 1,
                name: '在线',
                color: '#34b857',
              },
              {
                key: 2,
                name: '忙碌',
                color: '#ffaf3d',
              },
              {
                key: 3,
                name: '离开',
                color: '#e81332',
                disabled: true,
              },
            ].map(({ key, name, color, disabled }) => ({
              key,
              disabled,
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
          },
          {
            key: 'logout',
            label: '退出登录',
            onClick: () => {
              deleteSession().then(() => {
                window.location.href = '/login';
              });
            },
          },
        ],
      }}
    >
      <button className="relative">
        <Avatar size={32} user={user} />
      </button>
    </Dropdown>
  );
}
