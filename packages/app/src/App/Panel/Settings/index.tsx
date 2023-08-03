import { Fragment, JSXElementConstructor, useMemo, useState } from 'react';
import {
  Navigate,
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
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import cx from 'classnames';

import { Operators, NewOperator, EditOperator } from './Team/Operators';

interface NavSection {
  name: string;
  items: NavGroup[];
}

type IconConstructor = JSXElementConstructor<{ className?: string }>;

interface NavGroup {
  Icon: IconConstructor;
  name: string;
  path: string;
  children?: Omit<Required<NavGroup>, 'children'>[];
}

const navs: NavSection[] = [
  {
    name: '个人',
    items: [
      {
        Icon: MdAccountCircle,
        name: '账号',
        path: 'account',
      },
    ],
  },
  {
    name: '通用',
    items: [
      {
        Icon: HiUserGroup,
        name: '团队',
        path: 'team',
        children: [
          {
            Icon: FaUserCheck,
            name: '客服',
            path: 'operators',
          },
        ],
      },
    ],
  },
];

interface NavButtonProps {
  className?: string;
  Icon: IconConstructor;
  name: string;
  active?: boolean;
  arrow?: 'right' | 'down';
  onClick: () => void;
}

function NavButton({ className, Icon, name, active, arrow, onClick }: NavButtonProps) {
  return (
    <button
      className={cx('px-3 py-2 text-sm flex items-center w-full rounded', className, {
        'hover:bg-[rgba(100,116,145,0.08)] text-[#647491] hover:text-[#080f1a]': !active,
        'bg-primary-200 text-[#080f1a] font-medium': active,
      })}
      onClick={onClick}
    >
      <Icon
        className={cx('w-4 h-4', {
          'fill-primary': active,
        })}
      />
      <span className="mx-2">{name}</span>
      {arrow === 'right' && <BiChevronRight className="w-4 h-4" />}
      {arrow === 'down' && <BiChevronDown className="w-4 h-4" />}
    </button>
  );
}

function NavItem({ Icon, name, path, children }: NavGroup) {
  const location = useLocation();
  const resolved = useResolvedPath(path);
  const navigate = useNavigate();

  const active = useMemo(() => {
    const match = matchPath({ path: location.pathname, end: false }, resolved.pathname);
    return match !== null;
  }, [path, location.pathname, resolved.pathname]);

  const activeChild = useMemo(() => {
    if (children?.length) {
      for (const child of children) {
        const { pathname } = resolvePath(child.path, resolved.pathname);
        const match = matchPath({ path: pathname, end: false }, location.pathname);
        if (match) {
          return child;
        }
      }
    }
  }, [children, location.pathname, resolved.pathname]);

  const [expand, setExpand] = useState(!!activeChild);

  if (!children) {
    return <NavButton Icon={Icon} name={name} active={active} onClick={() => navigate(path)} />;
  }

  return (
    <>
      <NavButton
        Icon={Icon}
        name={name}
        arrow={expand ? 'down' : 'right'}
        onClick={() => setExpand(!expand)}
      />
      {expand &&
        children.map((child) => (
          <NavButton
            key={child.name}
            className="pl-[20px]"
            Icon={child.Icon}
            name={child.name}
            active={activeChild === child}
            onClick={() => navigate(`${path}/${child.path}`)}
          />
        ))}
    </>
  );
}

export default function Settings() {
  return (
    <div className="h-full grid grid-cols-[232px_1fr]">
      <div className="bg-[#f5f7f9] p-2 shadow-[rgba(0,27,71,0.12)_0px_2px_6px]">
        {navs.map(({ name, items }, i) => (
          <Fragment key={name}>
            <div
              className={cx('px-4 pb-[9px] text-xs text-[#647491] font-bold', {
                'pt-[5px]': i === 0,
                'pt-[19px]': i > 0,
              })}
            >
              {name}
            </div>
            {items.map((item) => (
              <NavItem key={item.name} {...item} />
            ))}
          </Fragment>
        ))}
      </div>
      <div className="p-[20px]">
        <Routes>
          <Route path="account">
            <Route index element="Todo" />
          </Route>
          <Route path="team">
            <Route path="operators">
              <Route index element={<Operators />} />
              <Route path="new" element={<NewOperator />} />
              <Route path=":id" element={<EditOperator />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="account" replace />} />
        </Routes>
      </div>
    </div>
  );
}
