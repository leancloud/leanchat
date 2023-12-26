import { Fragment, JSXElementConstructor, useMemo } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  matchPath,
  resolvePath,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router-dom';
import { HiUserGroup, HiTag } from 'react-icons/hi2';
import { FaUserCheck } from 'react-icons/fa';
import { IoFlashOutline } from 'react-icons/io5';
import { BsFillChatLeftDotsFill } from 'react-icons/bs';
import cx from 'classnames';

import { NavButton, NavMenu } from '../components/NavMenu';
import { Operators, NewOperator, EditOperator } from './Team/Operators';
import { Categories } from './Categories';
import { QuickReplies } from './QuickReplies';
import { ChatConfig } from './ChatConfig';
import { OperatorRole } from '../types';
import { useCurrentUser } from '../auth';
import { RequireRole } from '../components/RequireRole';

interface NavSection {
  name: string;
  items: NavGroup[];
}

type IconConstructor = JSXElementConstructor<{ className?: string }>;

interface NavGroup {
  icon: IconConstructor;
  name: string;
  path: string;
  children?: Omit<NavGroup, 'children'>[];
  roles?: OperatorRole[];
}

const navs: NavSection[] = [
  {
    name: '通用',
    items: [
      {
        icon: BsFillChatLeftDotsFill,
        name: '聊天设置',
        path: 'chat',
        roles: [OperatorRole.Admin],
      },
      {
        icon: HiUserGroup,
        name: '团队',
        path: 'team',
        roles: [OperatorRole.Admin],
        children: [
          {
            icon: FaUserCheck,
            name: '客服',
            path: 'operators',
          },
        ],
      },
      {
        icon: HiTag,
        name: '分类',
        path: 'categories',
        roles: [OperatorRole.Admin],
      },
      {
        icon: IoFlashOutline,
        name: '快捷回复',
        path: 'quick-replies',
      },
    ],
  },
];

function Navs({ navs }: { navs: NavSection[] }) {
  const { pathname } = useLocation();
  const { pathname: fromPathname } = useResolvedPath('.');

  const activePath = useMemo(() => {
    for (const item of navs.flatMap((nav) => nav.items)) {
      const paths = item.children
        ? item.children.map((child) => `${item.path}/${child.path}`)
        : [item.path];
      for (const path of paths) {
        const resolved = resolvePath(path, fromPathname);
        const match = matchPath({ path: pathname, end: false }, resolved.pathname);
        if (match) {
          return path;
        }
      }
    }
  }, [pathname, fromPathname]);

  const navigate = useNavigate();

  return (
    <div className="text-[#647491]">
      {navs.map(({ name, items }, i) => (
        <Fragment key={name}>
          <div
            className={cx('px-4 pb-[9px] text-xs font-bold', {
              'pt-[5px]': i === 0,
              'pt-[19px]': i > 0,
            })}
          >
            {name}
          </div>
          {items.map(({ name, path, children, icon }) => {
            if (children) {
              return (
                <NavMenu
                  key={name}
                  icon={icon}
                  label={name}
                  items={children.map(({ icon, name, path: childPath }) => ({
                    key: `${path}/${childPath}`,
                    icon: icon,
                    label: name,
                  }))}
                  activeKey={activePath}
                  onChange={navigate}
                />
              );
            }
            return (
              <NavButton
                key={name}
                icon={icon}
                active={path === activePath}
                onClick={() => navigate(path)}
              >
                {name}
              </NavButton>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function Layout({ navs }: { navs: NavSection[] }) {
  return (
    <div className="h-full grid grid-cols-[232px_1fr]">
      <div className="bg-[#f5f7f9] p-2 shadow-[rgba(0,27,71,0.12)_0px_2px_6px] max-h-full overflow-y-auto">
        <Navs navs={navs} />
      </div>
      <div className="p-[20px] max-h-full overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default function Settings() {
  const user = useCurrentUser();

  const availableNavs = useMemo(() => {
    const allow = (nav: Pick<NavGroup, 'roles'>) => !nav.roles || nav.roles.includes(user.role);
    return navs
      .map((nav) => ({
        ...nav,
        items: nav.items
          .filter(allow)
          .map<NavGroup>((item) => ({
            ...item,
            children: item.children?.filter(allow),
          }))
          .filter((item) => !item.children || item.children.length),
      }))
      .filter((nav) => nav.items.length);
  }, [user]);

  const defaultPath = useMemo(() => {
    const items = availableNavs.flatMap((nav) => nav.items);
    while (items.length) {
      const item = items.shift()!;
      if (item.children) {
        items.push(...item.children);
        continue;
      }
      return item.path;
    }
  }, [availableNavs]);

  return (
    <Routes>
      <Route element={<Layout navs={availableNavs} />}>
        <Route
          path="chat"
          element={
            <RequireRole roles={[OperatorRole.Admin]}>
              <ChatConfig />
            </RequireRole>
          }
        />
        <Route path="team/operators">
          <Route
            index
            element={
              <RequireRole roles={[OperatorRole.Admin]}>
                <Operators />
              </RequireRole>
            }
          />
          <Route
            path="new"
            element={
              <RequireRole roles={[OperatorRole.Admin]}>
                <NewOperator />
              </RequireRole>
            }
          />
          <Route
            path=":id"
            element={
              <RequireRole roles={[OperatorRole.Admin]}>
                <EditOperator />
              </RequireRole>
            }
          />
        </Route>
        <Route
          path="categories"
          element={
            <RequireRole roles={[OperatorRole.Admin]}>
              <Categories />
            </RequireRole>
          }
        />
        <Route path="quick-replies" element={<QuickReplies />} />
      </Route>
      {defaultPath && <Route path="*" element={<Navigate to={defaultPath} replace />} />}
    </Routes>
  );
}
