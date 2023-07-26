import { JSXElementConstructor, PropsWithChildren, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';

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
        <div className="grow bg-[#eff2f6] flex flex-col overflow-hidden">
          <div className="shrink-0 h-[60px] bg-white shadow"></div>
          <div className="grow overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function CustomSider({ children }: PropsWithChildren) {
  const container = document.getElementById(CUSTOM_SIDER_ID);
  return container && createPortal(children, container);
}

function Nav({ to, icon: Icon }: Nav) {
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
      <Icon className="text-[24px] m-auto" />
    </NavLink>
  );
}
