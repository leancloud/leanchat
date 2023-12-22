import {
  Fragment,
  JSXElementConstructor,
  PropsWithChildren,
  ReactNode,
  RefObject,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AiOutlineFile } from 'react-icons/ai';
import { FiArrowDown } from 'react-icons/fi';
import { Divider, Image, Tooltip } from 'antd';
import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import cx from 'classnames';
import _ from 'lodash';

import { Message as IMessage, MessageType, Operator, UserType } from '@/Panel/types';
import { useNow } from '../contexts/NowContext';
import { useConversationMessages, useVisitorMessages } from '../hooks/message';
import { useOperators } from '../hooks/operator';
import { useConversationContext } from './contexts/ConversationContext';
import style from './MessageList.module.css';
import { bytesToSize } from './utils';
import { useOperatorName } from './hooks/useOperatorName';
import { EvaluationStar } from './components/EvaluationStar';

const markdownComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

interface DateGroup {
  date: dayjs.Dayjs;
  messages: (MessageGroup | MessageItem)[];
}

interface MessageGroup {
  type: 'messageGroup';
  from: IMessage['from'];
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

interface FileMessageProps {
  file: {
    name: string;
    mime?: string;
    size?: number;
    url: string;
  };
}

function FileMessage({ file }: FileMessageProps) {
  if (file.mime && file.mime.startsWith('image/')) {
    return <Image className="object-contain" width={100} height={100} src={file.url} />;
  }
  return (
    <div className="flex items-center bg-white w-[200px] h-[50px] pl-1 pr-2">
      <AiOutlineFile className="w-8 h-8 shrink-0" />
      <div className="ml-1 grow overflow-hidden">
        <div className="text-sm truncate">{file.name}</div>
        <div className="flex text-xs mt-1">
          {file.size !== undefined && <div>{bytesToSize(file.size)}</div>}
          <a className="ml-auto text-primary" href={file.url} target="_blank">
            下载
          </a>
        </div>
      </div>
    </div>
  );
}

interface MessageGroupProps {
  isLeft: boolean;
  from: MessageGroup['from'];
  messages: IMessage[];
  operatorMap: Record<string, Operator>;
}

function MessageGroup({ from, isLeft, messages, operatorMap }: MessageGroupProps) {
  const { conversation } = useConversationContext();

  const getSenderName = () => {
    switch (from.type) {
      case UserType.Visitor:
        return conversation.visitor?.name || `用户${from.id.slice(-6)}`;
      case UserType.Operator:
        const operator = operatorMap[from.id];
        if (operator) {
          return `${operator.externalName} (${operator.internalName})`;
        }
        return `客服 ${from.id.slice(-6)}`;
      case UserType.System:
        return '机器人客服';
    }
  };

  return (
    <div
      className={cx('my-5 px-5 flex flex-col', {
        'items-start': isLeft,
        'items-end': !isLeft,
      })}
    >
      <div className={cx('text-xs px-1 mb-1')}>{getSenderName()}</div>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cx('flex items-end gap-2 mb-1', {
            'flex-row-reverse': !isLeft,
          })}
        >
          <Bubble isVisitor={isLeft}>
            {message.data.text && (
              <Markdown
                className="min-w-[16px] whitespace-pre-line break-all"
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.data.text}
              </Markdown>
            )}
            {message.data.file && <FileMessage file={message.data.file} />}
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
        'text-sm p-[10px] rounded-lg',
        {
          'bg-green-100': isVisitor,
          'bg-[#e8f3fe]': !isVisitor,
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

interface MessageComponentProps {
  message: IMessage;
}

function LogMessage({ children, createdAt }: PropsWithChildren<{ createdAt: string }>) {
  return (
    <div className="flex justify-center my-4">
      <Tooltip title={dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}>
        <div className="text-xs bg-[#e7e7e7] rounded px-2 py-1 max-w-[80%]">{children}</div>
      </Tooltip>
    </div>
  );
}

function EvaluateMessage({ message }: MessageComponentProps) {
  const { star, feedback, tags } = message.data.evaluation as {
    star: number;
    feedback?: string;
    tags?: string[];
  };

  return (
    <LogMessage createdAt={message.createdAt}>
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          用户已评价: <EvaluationStar className="ml-1" count={star} />
        </div>
        {tags && <div>评价标签: {tags.join(',')}</div>}
        {feedback && <div className="mt-0.5 break-all">{feedback}</div>}
      </div>
    </LogMessage>
  );
}

function CloseConversation({ message }: MessageComponentProps) {
  return (
    <LogMessage createdAt={message.createdAt}>
      <div>
        {
          {
            [UserType.Visitor]: '用户',
            [UserType.Operator]: '客服',
            [UserType.System]: '系统',
          }[message.from.type]
        }
        关闭了会话
      </div>
    </LogMessage>
  );
}

function ReopenConversation({ message }: MessageComponentProps) {
  return (
    <LogMessage createdAt={message.createdAt}>
      <div>
        {
          {
            [UserType.Visitor]: '用户',
            [UserType.Operator]: '客服',
            [UserType.System]: '系统',
          }[message.from.type]
        }
        重新打开了会话
      </div>
    </LogMessage>
  );
}

const MessageComponents: Record<number, JSXElementConstructor<MessageComponentProps>> = {
  [MessageType.Evaluate]: EvaluateMessage,
  [MessageType.Assign]: memo(({ message }) => {
    const name = useOperatorName(message.data.operatorId);
    return <LogMessage createdAt={message.createdAt}>{name} 进入会话</LogMessage>;
  }),
  [MessageType.Close]: CloseConversation,
  [MessageType.Reopen]: ReopenConversation,
};

function useAtBottom(ref: RefObject<HTMLElement>) {
  const [atBottom, setAtBottom] = useState(true);

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
          if (message.type === MessageType.Message) {
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
      if (message.type === MessageType.Message) {
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

  const { data: operators } = useOperators();
  const operatorMap = useMemo(() => _.keyBy(operators, (o) => o.id), []);

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

        <Image.PreviewGroup>
          {messageItems.map(({ date, messages }) => (
            <Fragment key={date.unix()}>
              <DateDivider date={date} />
              {messages.map((item) => {
                if (item.type === 'messageGroup') {
                  return (
                    <MessageGroup
                      key={item.messages[0].id}
                      isLeft={item.from.type === UserType.Visitor}
                      from={item.from}
                      messages={item.messages}
                      operatorMap={operatorMap}
                    />
                  );
                }
                const Component = MessageComponents[item.message.type];
                if (Component) {
                  return <Component key={item.message.id} message={item.message} />;
                } else {
                  return null;
                }
              })}
            </Fragment>
          ))}
        </Image.PreviewGroup>

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
