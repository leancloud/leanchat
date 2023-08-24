import { ReactNode } from 'react';
import cx from 'classnames';

interface ConversationItemProps {
  active?: boolean;
  avatar: ReactNode;
  title: string;
  time?: string;
  message?: string;
  operatorAvatar?: ReactNode;
  unread?: boolean;
}

export function ConversationItem({
  active,
  avatar,
  title,
  time,
  message,
  operatorAvatar,
  unread,
}: ConversationItemProps) {
  return (
    <div
      className={cx(
        'h-[60px] px-5 py-4 border-b cursor-pointer box-content text-left hover:bg-[#eff2f6]',
        {
          'bg-[#eff2f6]': active,
        },
      )}
    >
      <div className="flex items-center">
        {avatar}
        <div className="ml-[10px] grow overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate mr-auto">{title}</div>
            {unread && <div className="w-2 h-2 rounded-full bg-[#0566ff] mx-2 shrink-0" />}
            {time && <div className="text-xs shrink-0">{time}</div>}
          </div>
          <div className="text-xs text-[#647491]">Live chat</div>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <div
          className={cx('text-sm mr-auto truncate', {
            'font-bold': unread,
          })}
        >
          {message}
        </div>
        {operatorAvatar}
      </div>
    </div>
  );
}
