import { ReactNode, useMemo } from 'react';
import cx from 'classnames';
import dayjs from 'dayjs';

import { Conversation } from '../types';
import { useNow } from '../contexts/NowContext';
import { diffTime } from './utils';

interface UnreadAlertProps {
  waitedAt: string;
}

function UnreadAlert({ waitedAt }: UnreadAlertProps) {
  const now = useNow();

  const waitedTime = useMemo(() => {
    const seconds = dayjs(now).diff(waitedAt, 'second');
    return {
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
    };
  }, [now, waitedAt]);

  return (
    <div className="text-xs text-white leading-[20px] font-mono bg-[#3884F7] px-1.5 rounded-full">
      {waitedTime.minutes < 10 ? `0${waitedTime.minutes}` : waitedTime.minutes}:
      {waitedTime.seconds < 10 ? `0${waitedTime.seconds}` : waitedTime.seconds}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  active?: boolean;
  avatar: ReactNode;
  title: string;
  message?: string;
  unreadAlert?: boolean;
}

export function ConversationItem({
  conversation,
  active,
  avatar,
  title,
  message,
  unreadAlert,
}: ConversationItemProps) {
  const visitorWaitedAt = useMemo(() => {
    if (!unreadAlert) return;
    if (conversation.lastMessage?.sender.type === 'visitor') {
      return conversation.lastMessage.createdAt;
    }
  }, [conversation.lastMessage, unreadAlert]);

  const now = useNow();

  return (
    <div
      className={cx(
        'px-5 py-4 border-b cursor-pointer box-content text-left transition-colors hover:bg-[#f7f7f7] border-l-2',
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
        {conversation.lastMessage && (
          <div className="text-xs text-[#a8a8a8] shrink-0 ml-2">
            {diffTime(now, conversation.lastMessage.createdAt)}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center">
        <div
          className={cx('text-sm text-[#646464] mr-auto truncate', {
            'font-bold': visitorWaitedAt,
          })}
        >
          {message}
        </div>
        {visitorWaitedAt && <UnreadAlert waitedAt={visitorWaitedAt} />}
      </div>
    </div>
  );
}
