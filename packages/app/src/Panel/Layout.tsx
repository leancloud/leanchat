import {
  JSXElementConstructor,
  PropsWithChildren,
  ReactNode,
  useLayoutEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { Avatar } from 'antd';

import { UserDetails } from './UserDetails';
import { useToggle } from 'react-use';
import { useUserStatus } from './states/user';

const CUSTOM_SIDER_ID = 'customSider';

interface Nav {
  to: string;
  icon: JSXElementConstructor<{ className?: string }>;
}

export interface LayoutProps {
  navs?: Nav[];
  children?: ReactNode;
}

export function Layout({ navs, children }: LayoutProps) {
  const [showUserDetails, toggleUserDetails] = useToggle(false);

  return (
    <div className="h-screen flex min-w-[1200px]">
      <div className="grow flex border-t-4 border-primary">
        <div className="flex z-[99]">
          <div className="w-[60px] bg-[#1c2b45]">
            {navs?.map((nav) => (
              <Nav key={nav.to} {...nav} />
            ))}
          </div>
          <div id={CUSTOM_SIDER_ID}></div>
        </div>
        <div className="grow bg-[#eff2f6] flex flex-col overflow-hidden relative">
          <div className="shrink-0 h-[60px] bg-white shadow z-10 flex items-center px-5">
            <div className="grow"></div>
            <div className="shrink-0">
              <User onClick={toggleUserDetails} />
            </div>
          </div>
          <div className="grow overflow-x-hidden overflow-y-auto">{children}</div>
          <UserDetails show={showUserDetails} onToggle={toggleUserDetails} />
        </div>
      </div>
    </div>
  );
}

export function CustomSider({ children }: PropsWithChildren) {
  const [, forceUpdate] = useState({});
  const container = document.getElementById(CUSTOM_SIDER_ID);
  useLayoutEffect(() => {
    if (!container) {
      forceUpdate({});
    }
  }, []);
  return container && createPortal(children, container);
}

function Nav({ icon: Icon, to }: Nav) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx('flex w-[60px] h-[60px]', {
          'text-white bg-[#21324e]': isActive,
          'text-[#647491] hover:bg-[#21324e]': !isActive,
        })
      }
    >
      <Icon className="m-auto w-[22px] h-[22px]" />
    </NavLink>
  );
}

interface UserProps {
  onClick: () => void;
}

function User({ onClick }: UserProps) {
  const [status] = useUserStatus();

  return (
    <div className="flex items-center">
      <button onClick={onClick}>
        <Avatar />
      </button>

      <button
        className={cx('w-3 h-3 rounded-full ml-3', {
          'bg-[#34b857]': status === 'ready',
          'bg-[#d7dae1]': status === 'leave',
          'bg-[#e81332]': status === 'busy',
        })}
        onClick={onClick}
      ></button>
    </div>
  );
}
