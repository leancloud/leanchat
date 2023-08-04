import { JSXElementConstructor, ReactNode, useMemo, useState } from 'react';
import { BiChevronRight, BiChevronDown } from 'react-icons/bi';
import cx from 'classnames';

interface NavButtonProps {
  className?: string;
  icon?: JSXElementConstructor<{ className?: string }>;
  children?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  inverted?: boolean;
  onClick?: () => void;
}

export function NavButton({
  className,
  icon: Icon,
  children,
  badge,
  active,
  inverted,
  onClick,
}: NavButtonProps) {
  return (
    <button
      className={cx(
        'px-3 py-2 w-full flex items-center rounded text-sm',
        {
          'text-[#acb8cb] hover:text-white hover:bg-[#354869]': inverted,
          'hover:bg-[rgba(100,116,145,0.08)]': !inverted && !active,
          'hover:text-[#080f1a]': !inverted,
          'bg-[#354869]': inverted && active,
          'bg-[#dce9ff] text-[#080f1a] font-medium': !inverted && active,
        },
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <Icon
          className={cx('w-4 h-4 mr-2', {
            'fill-primary-700': !inverted && active,
          })}
        />
      )}
      <div className="flex items-center mr-auto">{children}</div>
      {badge}
    </button>
  );
}

interface NavMenuItem {
  key: string;
  icon?: NavButtonProps['icon'];
  label?: ReactNode;
  badge?: NavButtonProps['badge'];
}

interface NavMenuProps {
  icon?: NavButtonProps['icon'];
  label?: ReactNode;
  items?: NavMenuItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  inverted?: boolean;
}

export function NavMenu({ icon, label, items, activeKey, onChange, inverted }: NavMenuProps) {
  const activeItem = useMemo(() => {
    return items?.find((item) => item.key === activeKey);
  }, [items, activeKey]);

  const [expanded, setExpanded] = useState(!!activeItem);

  return (
    <div
      className={cx({
        'pb-3': expanded || activeItem,
      })}
    >
      <NavButton icon={icon} onClick={() => setExpanded(!expanded)} inverted={inverted}>
        {label}
        {expanded ? (
          <BiChevronDown className="w-4 h-4 ml-0.5" />
        ) : (
          <BiChevronRight className="w-4 h-4 ml-0.5" />
        )}
      </NavButton>
      {expanded &&
        items?.map((item) => (
          <NavButton
            className="pl-[20px]"
            key={item.key}
            active={item.key === activeKey}
            onClick={onChange && (() => onChange(item.key))}
            inverted={inverted}
            icon={item.icon}
            badge={item.badge}
          >
            {item.label}
          </NavButton>
        ))}
      {!expanded && activeItem && (
        <NavButton
          active
          className="pl-[20px]"
          onClick={onChange && (() => onChange(activeItem.key))}
          inverted={inverted}
          icon={activeItem.icon}
          badge={activeItem.badge}
        >
          {activeItem.label}
        </NavButton>
      )}
    </div>
  );
}
