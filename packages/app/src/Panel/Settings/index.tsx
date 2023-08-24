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
import { HiUserGroup } from 'react-icons/hi2';
import { FaUserCheck } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { BiBot } from 'react-icons/bi';
import cx from 'classnames';

import { NavButton, NavMenu } from '../components/NavMenu';
import { ChatBots, NewChatBot, ChatBotDetail } from './ChatBots';
import { Operators, NewOperator, EditOperator } from './Team/Operators';

interface NavSection {
  name: string;
  items: NavGroup[];
}

type IconConstructor = JSXElementConstructor<{ className?: string }>;

interface NavGroup {
  icon: IconConstructor;
  name: string;
  path?: string;
  children?: Omit<Required<NavGroup>, 'children'>[];
}

const navs: NavSection[] = [
  {
    name: '个人',
    items: [
      {
        icon: MdAccountCircle,
        name: '账号',
        path: 'account',
      },
    ],
  },
  {
    name: '自动化',
    items: [
      {
        icon: BiBot,
        name: '聊天机器人',
        path: 'chat-bots',
      },
    ],
  },
  {
    name: '通用',
    items: [
      {
        icon: HiUserGroup,
        name: '团队',
        children: [
          {
            icon: FaUserCheck,
            name: '客服',
            path: 'team/operators',
          },
        ],
      },
    ],
  },
];

function Navs() {
  const { pathname } = useLocation();
  const { pathname: fromPathname } = useResolvedPath('.');

  const activePath = useMemo(() => {
    for (const item of navs.flatMap((nav) => nav.items)) {
      if (item.path) {
        const resolved = resolvePath(item.path, fromPathname);
        const match = matchPath({ path: pathname, end: false }, resolved.pathname);
        if (match) {
          return item.path;
        }
      }
      if (item.children) {
        for (const child of item.children) {
          const resolved = resolvePath(child.path, fromPathname);
          const match = matchPath({ path: pathname, end: false }, resolved.pathname);
          if (match) {
            return child.path;
          }
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
            if (path) {
              const active = path === activePath;
              return (
                <NavButton key={name} icon={icon} active={active} onClick={() => navigate(path)}>
                  {name}
                </NavButton>
              );
            }
            if (children) {
              return (
                <NavMenu
                  key={name}
                  icon={icon}
                  label={name}
                  items={children.map(({ icon, name, path }) => ({
                    key: path,
                    icon: icon,
                    label: name,
                  }))}
                  activeKey={activePath}
                  onChange={navigate}
                />
              );
            }
          })}
        </Fragment>
      ))}
    </div>
  );
}

function Layout() {
  return (
    <div className="h-full grid grid-cols-[232px_1fr]">
      <div className="bg-[#f5f7f9] p-2 shadow-[rgba(0,27,71,0.12)_0px_2px_6px] max-h-full overflow-y-auto">
        <Navs />
      </div>
      <div className="p-[20px] max-w-[1280px] max-h-full overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="account">
          <Route index element="Todo" />
        </Route>
        <Route path="chat-bots">
          <Route index element={<ChatBots />} />
        </Route>
        <Route path="team/operators">
          <Route index element={<Operators />} />
          <Route path="new" element={<NewOperator />} />
          <Route path=":id" element={<EditOperator />} />
        </Route>
      </Route>
      <Route path="chat-bots/new" element={<NewChatBot />} />
      <Route path="chat-bots/:id" element={<ChatBotDetail />} />
      <Route path="*" element={<Navigate to="account" replace />} />
    </Routes>
  );
}
