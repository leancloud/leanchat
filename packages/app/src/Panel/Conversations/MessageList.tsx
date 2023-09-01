import {
  Fragment,
  ReactNode,
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FiArrowDown } from 'react-icons/fi';
import { Divider } from 'antd';
import dayjs from 'dayjs';
import cx from 'classnames';
import _ from 'lodash';

import { Message as IMessage } from '@/Panel/types';
import { useNow } from '../contexts/NowContext';
import { useConversationMessages, useVisitorMessages } from '../hooks/message';
import { useConversationContext } from './ConversationContext';
import style from './MessageList.module.css';

interface DateGroup {
  date: dayjs.Dayjs;
  messages: (MessageGroup | MessageItem)[];
}

interface MessageGroup {
  type: 'messageGroup';
  from: any;
  messages: IMessage[];
}

interface MessageItem {
  type: 'messageItem';
  message: IMessage;
}

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

interface MessageGroupProps {
  isLeft: boolean;
  from: any;
  messages: IMessage[];
}

function MessageGroup({ from, isLeft, messages }: MessageGroupProps) {
  return (
    <div
      className={cx('my-5 px-5 flex flex-col', {
        'items-start': isLeft,
        'items-end': !isLeft,
      })}
    >
      <div className={cx('text-xs px-1 mb-1')}>{isLeft ? '用户' : from.id}</div>
      {messages.map((message) => (
        <div
          className={cx('flex items-end gap-2 mb-1', {
            'flex-row-reverse': !isLeft,
          })}
        >
          <Bubble className="" isVisitor={isLeft}>
            {message.data.content}
          </Bubble>
          <div className="text-gray-500 text-xs">{dayjs(message.createdAt).format('HH:mm')}</div>
        </div>
      ))}
    </div>
  );
}

interface BubbleProps {
  isVisitor: boolean;
  className?: string;
  children?: ReactNode;
}

function Bubble({ isVisitor, className, children }: BubbleProps) {
  return (
    <div
      className={cx(
        'text-sm text-[#646464] p-[10px] rounded-lg',
        {
          'border border-[#ececec]': isVisitor,
          'bg-[#e8f3fe]': !isVisitor,
        },
        className,
      )}
    >
      <div className="min-w-[16px] whitespace-pre-line break-words">{children}</div>
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

function useAtBottom(ref: RefObject<HTMLElement>) {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget as HTMLElement;
      setAtBottom(scrollTop + clientHeight === scrollHeight);
    };

    if (ref.current) {
      ref.current.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true,
      });
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      setAtBottom(scrollTop + clientHeight === scrollHeight);
    }

    return () => {
      ref.current?.removeEventListener('scroll', onScroll);
    };
  }, [ref]);

  return atBottom;
}

type ScrollBehavior = 'auto' | 'keep' | 'attachBottom';

export interface MessageListRef {
  setScrollBehavior: (behavior: ScrollBehavior) => void;
}

interface MessageListProps {
  history?: boolean;
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>((props, ref) => {
  const { history } = props;

  const { conversation } = useConversationContext();

  const conversationMessages = useConversationMessages(conversation.id, {
    enabled: !history,
  });
  const visitorMessages = useVisitorMessages(conversation.visitorId, {
    enabled: history,
  });

  const messages = history ? visitorMessages.messages : conversationMessages.messages;

  const hasMoreMessages = history ? visitorMessages.hasMore : conversationMessages.hasMore;

  const fetchMoreMessages = history ? visitorMessages.loadMore : conversationMessages.loadMore;

  const messageItems = useMemo(() => {
    const dateGroups: DateGroup[] = [];
    messages?.forEach((message) => {
      const date = dayjs(message.createdAt).startOf('day');
      if (dateGroups.length > 0) {
        const dateGroup = dateGroups[dateGroups.length - 1];
        if (dateGroup.date.isSame(date)) {
          if (message.type === 'message') {
            const lastMessage = dateGroup.messages[dateGroup.messages.length - 1];
            if (lastMessage.type === 'messageGroup') {
              if (lastMessage.from.id === message.from.id) {
                lastMessage.messages.push(message);
                return;
              }
            }
            dateGroup.messages.push({
              type: 'messageGroup',
              from: message.from,
              messages: [message],
            });
            return;
          }
          dateGroup.messages.push({
            type: 'messageItem',
            message,
          });
          return;
        }
      }
      if (message.type === 'message') {
        dateGroups.push({
          date,
          messages: [
            {
              type: 'messageGroup',
              from: message.from,
              messages: [message],
            },
          ],
        });
        return;
      }
      dateGroups.push({
        date,
        messages: [
          {
            type: 'messageItem',
            message,
          },
        ],
      });
    });
    return dateGroups;
  }, [messages]);

  const containerRef = useRef<HTMLDivElement>(null!);
  const containerScrollHeight = useRef(0);

  const scrollBehavior = useRef<ScrollBehavior>('attachBottom');

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    const { scrollHeight, clientHeight } = containerElement;
    if (scrollBehavior.current === 'keep') {
      containerElement.scrollTop += scrollHeight - containerScrollHeight.current;
    } else if (scrollBehavior.current === 'attachBottom') {
      containerElement.scrollTop = scrollHeight - clientHeight;
    }
    containerScrollHeight.current = containerElement.scrollHeight;
    if (scrollBehavior.current === 'keep') {
      scrollBehavior.current = 'auto';
    }
  }, [messages]);

  const atBottom = useAtBottom(containerRef);

  useEffect(() => {
    scrollBehavior.current = atBottom ? 'attachBottom' : 'auto';
    if (atBottom) {
      lastSeenMessageId.current = messages[messages.length - 1]?.id;
      setUnreadMessageCount(0);
    }
  }, [atBottom]);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const lastSeenMessageId = useRef<string>();

  const scrollToBottom = useCallback(() => {
    const containerElement = containerRef.current;
    containerElement.scrollTo({
      top: containerElement.scrollHeight - containerElement.clientHeight,
    });
  }, []);

  useEffect(() => {
    if (!lastSeenMessageId.current) {
      lastSeenMessageId.current = messages[messages.length - 1]?.id;
    }
    if (scrollBehavior.current !== 'attachBottom') {
      let unreadMessageCount = 0;
      for (let i = messages.length - 1; i >= 0; --i) {
        const message = messages[i];
        if (message.id === lastSeenMessageId.current) {
          break;
        }
        unreadMessageCount += 1;
      }
      setUnreadMessageCount(unreadMessageCount);
    }
  }, [messages]);

  useImperativeHandle(ref, () => ({
    setScrollBehavior: (behavior) => (scrollBehavior.current = behavior),
  }));

  return (
    <div className="grow relative overflow-hidden">
      <div ref={containerRef} className={cx('h-full overflow-y-auto', style.messageList)}>
        <div className="flex justify-center items-center h-12">
          {hasMoreMessages ? (
            <button
              className="text-xs bg-primary-100 px-2 py-1 rounded flex items-center"
              onClick={() => {
                scrollBehavior.current = 'keep';
                fetchMoreMessages();
              }}
            >
              加载更多
            </button>
          ) : (
            <div className="text-sm text-[#969696]">没有更多</div>
          )}
        </div>

        {messageItems.map(({ date, messages }) => (
          <Fragment key={date.unix()}>
            <DateDivider date={date} />
            {messages.map((item) => {
              if (item.type === 'messageGroup') {
                return (
                  <MessageGroup
                    key={item.from.id}
                    isLeft={item.from.type === 'visitor'}
                    from={item.from}
                    messages={item.messages}
                  />
                );
              }
              return <LogMessage key={item.message.id} message={item.message} />;
            })}
          </Fragment>
        ))}

        {unreadMessageCount > 0 && (
          <button
            className="absolute bottom-2 left-[50%] -translate-x-[50%] bg-[#3884F7] text-white text-sm pl-2 pr-3 py-1 rounded-full flex items-center"
            onClick={scrollToBottom}
          >
            <FiArrowDown className="w-4 h-4 mr-1" />
            未读消息
          </button>
        )}
      </div>
    </div>
  );
});
