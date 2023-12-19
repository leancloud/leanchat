import { ReactNode, useMemo } from 'react';
import cx from 'classnames';
import dayjs from 'dayjs';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { Dropdown } from 'antd';

import { useNow } from '../contexts/NowContext';
import { diffTime } from './utils';
import { EvaluationStar } from './components/EvaluationStar';
import { BaseConversation } from './ConversationList';
import { ConversationStatus } from '../types';

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

export interface ConversationItemProps<T> {
  conversation: T;
  active?: boolean;
  avatar: ReactNode;
  title: string;
  message?: string;
  unreadAlert?: boolean;
  menu?: {
    items: {
      key: string;
      label: string;
    }[];
    onClick: (e: { conversation: T; key: string }) => void;
  };
}

export function ConversationItem<T extends BaseConversation>({
  conversation,
  active,
  avatar,
  title,
  message,
  unreadAlert,
  menu,
}: ConversationItemProps<T>) {
  const now = useNow();

  return (
    <div
      className={cx(
        'px-5 py-4 border-b cursor-pointer box-content text-left transition-colors hover:bg-[#f7f7f7] border-l-2 group',
        {
          'border-l-transparent': !active,
          'bg-[#f7f7f7] border-l-[#3884f7]': active,
        },
      )}
    >
      <div className="flex items-center">
        {avatar}
        <div className="ml-[10px] overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate">{title}</div>
          </div>
        </div>
        {conversation.evaluation && (
          <EvaluationStar className="ml-2" count={conversation.evaluation.star} />
        )}
        <div className="grow" />
        {conversation.lastMessage && (
          <div className={cx('text-xs text-[#a8a8a8] shrink-0 ml-2', menu && 'group-hover:hidden')}>
            {diffTime(now, conversation.lastMessage.createdAt)}
          </div>
        )}
        {menu && (
          <Dropdown
            menu={{
              items: menu.items,
              onClick: ({ domEvent, key }) => {
                domEvent.stopPropagation();
                menu.onClick({ conversation, key });
              },
            }}
            trigger={['click']}
          >
            <button
              className="hidden group-hover:flex text-[#969696] w-6 h-6 rounded hover:bg-[#e7e7e7]"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <BsThreeDotsVertical className="m-auto" />
            </button>
          </Dropdown>
        )}
      </div>
      <div className="mt-4 flex items-center">
        <div
          className={cx('text-sm text-[#646464] mr-auto truncate', {
            'font-bold': unreadAlert && conversation.visitorWaitingSince,
          })}
        >
          {message}
        </div>
        {unreadAlert &&
          conversation.status !== ConversationStatus.Closed &&
          conversation.visitorWaitingSince && (
            <UnreadAlert waitedAt={conversation.visitorWaitingSince} />
          )}
      </div>
    </div>
  );
}
