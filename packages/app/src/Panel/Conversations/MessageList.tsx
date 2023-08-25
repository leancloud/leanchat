import { useMemo } from 'react';
import { Divider } from 'antd';
import dayjs from 'dayjs';
import cx from 'classnames';
import _ from 'lodash';

import { Message as IMessage } from '@/Panel/types';
import { useNow } from '../contexts/NowContext';

type IMessageItem =
  | {
      type: 'dateDivider';
      date: dayjs.Dayjs;
    }
  | {
      type: 'message';
      message: IMessage;
    };

interface DateDividerProps {
  date: string | number | Date | dayjs.Dayjs;
}

function DateDivider({ date }: DateDividerProps) {
  const now = useNow();

  const today = dayjs(now).format('YYYY-MM-DD');
  const content = dayjs(date).format('YYYY-MM-DD');

  return (
    <Divider style={{ margin: 0, padding: '10px 20px', fontSize: 14 }}>
      {content === today ? '今天' : content}
    </Divider>
  );
}

interface TextMessageProps {
  message: IMessage;
  position: 'left' | 'right';
}

function TextMessage({ message, position }: TextMessageProps) {
  const isLeft = position === 'left';

  return (
    <div
      className={cx('my-5 px-5 flex flex-col', {
        'items-start': isLeft,
        'items-end': !isLeft,
      })}
    >
      <div
        className={cx('text-xs px-1 mb-1 flex gap-2', {
          'flex-row-reverse': !isLeft,
        })}
      >
        <div>{isLeft ? '用户' : message.from.id}</div>
        <div className="text-gray-500">{dayjs(message.createdAt).format('HH:mm')}</div>
      </div>
      <div
        className={cx(
          'text-sm text-[#646464] p-[10px] inline-block whitespace-pre-line rounded-lg max-w-[85%]',
          {
            'border border-[#ececec]': isLeft,
            'bg-[#e8f3fe]': !isLeft,
          },
        )}
      >
        <div className="min-w-[16px]">{message.data.content}</div>
      </div>
    </div>
  );
}

const systemMessages: Record<string, string> = {
  evaluated: '用户已评价',
};

interface LogMessageProps {
  message: IMessage;
}

function LogMessage({ message }: LogMessageProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="text-xs bg-[#e7e7e7] rounded-full px-3 py-1">
        系统消息：{systemMessages[message.data.type]}
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: IMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const messageItems = useMemo(() => {
    const items: IMessageItem[] = [];
    let lastDate: dayjs.Dayjs | undefined;
    messages.forEach((message) => {
      const date = dayjs(message.createdAt).startOf('day');
      if (lastDate && !lastDate.isSame(date)) {
        items.push({ type: 'dateDivider', date });
      }
      items.push({ type: 'message', message });
      lastDate = date;
    });
    return items;
  }, [messages]);

  return (
    <div>
      {messageItems.map((item) => {
        if (item.type === 'dateDivider') {
          return <DateDivider key={item.date.unix()} date={item.date} />;
        }
        const { message } = item;
        if (message.type === 'message') {
          if (message.data.type === 'text') {
            return (
              <TextMessage
                key={message.id}
                message={message}
                position={message.from.type === 'visitor' ? 'left' : 'right'}
              />
            );
          }
        }
        if (message.type === 'log') {
          return <LogMessage key={message.id} message={message} />;
        }
        return <div key={message.id}>不支持的消息类型</div>;
      })}
    </div>
  );
}
