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

export interface NavMenuItem {
  key: string;
  icon?: NavButtonProps['icon'];
  label?: ReactNode;
  badge?: NavButtonProps['badge'];
  active?: boolean;
  onClick?: () => void;
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
  const activeItems = useMemo(() => {
    return items?.filter((item) => item.active || item.key === activeKey);
  }, [items, activeKey]);

  const hasActiveItems = activeItems && activeItems.length > 0;

  const [expanded, setExpanded] = useState(hasActiveItems);

  const renderItems = expanded ? items : activeItems;

  return (
    <div
      className={cx({
        'pb-3': expanded || hasActiveItems,
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
      {renderItems?.map((item) => (
        <NavButton
          key={item.key}
          className="pl-[20px]"
          active={item.active || item.key === activeKey}
          onClick={() => {
            item.onClick?.();
            onChange?.(item.key);
          }}
          inverted={inverted}
          icon={item.icon}
          badge={item.badge}
        >
          {item.label}
        </NavButton>
      ))}
    </div>
  );
}
