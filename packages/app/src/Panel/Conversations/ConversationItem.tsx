import { ReactNode } from 'react';
import cx from 'classnames';

interface ConversationItemProps {
  active?: boolean;
  avatar: ReactNode;
  title: string;
  time?: string;
  message?: string;
  unread?: boolean;
}

export function ConversationItem({
  active,
  avatar,
  title,
  time,
  message,
  unread,
}: ConversationItemProps) {
  return (
    <div
      className={cx(
        'h-[60px] p-5 border-b cursor-pointer box-content text-left transition-colors hover:bg-[#f7f7f7] border-l-2',
        {
          'border-l-transparent': !active,
          'bg-[#f7f7f7] border-l-[#3884f7]': active,
        },
      )}
    >
      <div className="flex items-center">
        {avatar}
        <div className="ml-[10px] grow overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate mr-auto">{title}</div>
          </div>
        </div>
        {time && <div className="text-xs text-[#a8a8a8] shrink-0 ml-2">{time}</div>}
      </div>
      <div className="mt-2 flex items-center">
        <div
          className={cx('text-sm text-[#646464] mr-auto truncate', {
            'font-bold': unread,
          })}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
