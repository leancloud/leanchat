import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { Avatar, Badge, Button, Divider, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import cx from 'classnames';
import _ from 'lodash';

import { callRpc, useEvent, useSocket } from '@/socket';
import { useAuth } from '../auth';
import { CustomSider } from '../Layout';
import { diffTime } from './utils';
import { NavMenu } from '../components/NavMenu';
import {
  Conversation,
  Message,
  getConversationMessages,
  getConversations,
  joinConversation,
} from '../api/conversation';

export default function Conversations() {
  const { user } = useAuth();

  const [stream, setStream] = useState('myOpen');

  const getConvOptions = useMemo(() => {
    switch (stream) {
      case 'unassigned':
        return { status: 'queued' };
      case 'myOpen':
        return { operatorId: user?.id };
      case 'solved':
        return { status: 'solved' };
    }
  }, [stream, user]);

  const { data: conversations } = useQuery({
    queryKey: ['Conversations', getConvOptions],
    queryFn: () => getConversations(getConvOptions),
  });

  const [currentConv, setCurrentConv] = useState<Conversation>();

  const handleChangeConversation = (conv: Conversation) => {
    setCurrentConv(conv);
  };

  const { mutate: join } = useMutation({
    mutationFn: joinConversation,
    onSuccess: (_data, id) => {
      setStream('myOpen');
      setCurrentConv((conv) => {
        if (conv && conv.id === id) {
          return { ...conv, operatorId: user?.id };
        }
        return conv;
      });
    },
  });

  return (
    <>
      <CustomSider>
        <Sider
          stream={stream}
          onChangeStream={setStream}
          conversations={conversations}
          onClickConversation={handleChangeConversation}
          activeConversationId={currentConv?.id}
        />
      </CustomSider>

      {currentConv && (
        <ChatBox
          convId={currentConv.id}
          mask={
            currentConv &&
            !currentConv.operatorId && <JoinConversationMask onJoin={() => join(currentConv.id)} />
          }
        />
      )}
    </>
  );
}

interface SiderProps {
  stream: string;
  onChangeStream: (stream: string) => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onClickConversation?: (conv: Conversation) => void;
}

function Sider({
  stream,
  onChangeStream,
  conversations,
  activeConversationId,
  onClickConversation,
}: SiderProps) {
  const contentByStream = useMemo<Record<string, ReactNode>>(
    () => ({
      unassigned: (
        <>
          <span className="mr-3">👋</span>
          <span>未分配</span>
        </>
      ),
      myOpen: (
        <>
          <span className="mr-3">📬</span>
          <span>分配给我的</span>
        </>
      ),
      solved: (
        <>
          <span className="mr-3">✅</span>
          <span>已解决</span>
        </>
      ),
    }),
    []
  );

  return (
    <div className="flex h-full">
      <div className="w-[232px] bg-[#21324e]">
        <div className="h-[60px] border-b border-[#1c2b45] flex items-center px-[20px]">
          <div className="text-white text-[20px] font-medium">收件箱</div>
        </div>
        <div className="p-2">
          <NavMenu
            inverted
            label="实时对话"
            items={[
              {
                key: 'unassigned',
                label: contentByStream['unassigned'],
                badge: <Badge count={5} size="small" />,
              },
              {
                key: 'myOpen',
                label: contentByStream['myOpen'],
              },
              {
                key: 'solved',
                label: contentByStream['solved'],
              },
            ]}
            activeKey={stream}
            onChange={onChangeStream}
          />
        </div>
      </div>
      <div className="w-[280px] shadow-md flex flex-col">
        <div className="px-5 py-4 border-[#eff2f6] border-b">
          <h2 className="font-medium text-[20px] leading-7">{contentByStream[stream]}</h2>
        </div>
        <div className="overflow-y-auto">
          <ConversationList
            data={conversations}
            onClick={onClickConversation}
            activeId={activeConversationId}
          />
        </div>
      </div>
    </div>
  );
}

interface ConversationListProps {
  data?: Conversation[];
  onClick?: (conv: Conversation) => void;
  activeId?: string;
}

function ConversationList({ data, onClick, activeId }: ConversationListProps) {
  const now = Date.now();

  return data?.map((conv) => (
    <div
      key={conv.id}
      className={cx('h-[60px] px-5 py-4 border-b hover:bg-[#eff2f6] cursor-pointer box-content', {
        'bg-[#eff2f6]': activeId === conv.id,
      })}
      onClick={() => onClick?.(conv)}
    >
      <div className="flex items-center">
        <Avatar className="shrink-0">{conv.id.slice(0, 1)}</Avatar>
        <div className="ml-[10px] grow overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate">{conv.id}</div>
            {conv.recentMessage && (
              <div className="text-xs ml-auto shrink-0">
                {diffTime(now, conv.recentMessage.createdAt)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#647491]">Live chat</div>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <div className="text-sm mr-auto">{conv.recentMessage?.data.content}</div>
        {conv.operatorId && <Avatar size={18} icon={<UserOutlined />} />}
      </div>
    </div>
  ));
}

interface MessageGroup {
  date: dayjs.Dayjs;
  messages: Message[];
}

function groupMessages(messages: Message[]) {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const date = dayjs(message.createdAt).startOf('day');
    const group = _.last(groups);
    if (group && group.date.isSame(date)) {
      group.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }
  }
  return groups;
}

function useMessageGroups() {
  const [groups, setGroups] = useState<MessageGroup[]>([]);

  const reset = useCallback(() => setGroups([]), []);

  const setHistoryMessages = useCallback((historyMessages: Message[]) => {
    setGroups((groups) => {
      const messages = _(groups)
        .flatMap((group) => group.messages)
        .concat(historyMessages)
        .uniqBy((message) => message.id)
        .value();
      return groupMessages(messages);
    });
  }, []);

  const push = useCallback((message: Message) => {
    const date = dayjs(message.createdAt).startOf('day');
    setGroups((groups) => {
      const group = _.last(groups);
      if (group && group.date.isSame(date)) {
        return [
          ...groups.slice(0, groups.length - 1),
          {
            ...group,
            messages: [...group.messages, message],
          },
        ];
      }
      return [
        ...groups,
        {
          date,
          messages: [message],
        },
      ];
    });
  }, []);

  return { groups, setHistoryMessages, push, reset };
}

interface ChatBoxProps {
  convId: string;
  mask?: ReactNode;
}

function ChatBox({ convId, mask }: ChatBoxProps) {
  const { user } = useAuth();
  const socket = useSocket();

  const { groups, setHistoryMessages, push, reset } = useMessageGroups();

  useEffect(() => {
    socket.emit('subscribeConversation', convId);
    reset();
    return () => {
      socket.emit('unsubscribeConversation', convId);
    };
  }, [convId]);

  const { data: historyMessages } = useInfiniteQuery<Message[]>({
    queryKey: ['Messages', convId],
    queryFn: () => getConversationMessages(convId),
  });

  useEffect(() => {
    if (historyMessages) {
      setHistoryMessages(historyMessages.pages.flat());
    }
  }, [historyMessages]);

  useEvent(socket, 'message', push);

  const [content, setContent] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [groups]);

  const handleCreateMessage = async () => {
    const trimedContent = content.trim();
    if (!trimedContent) {
      return;
    }
    const msg = await callRpc(socket, 'sendMessage', {
      cid: convId,
      text: trimedContent,
    });
    setContent('');
    textareaRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div ref={messageContainerRef} className="mt-auto overflow-y-auto">
        {groups.map(({ date, messages }) => (
          <div key={date.unix()}>
            <Divider style={{ margin: '10px 20px', fontSize: 14 }}>
              {dayjs(date).format('MMM DD, YYYY')}
            </Divider>
            {messages.map((msg) => (
              <TextMessage
                key={msg.id}
                avatar={<Avatar icon={<UserOutlined />} />}
                username={msg.from === user!.id ? 'You' : msg.from}
                createTime={msg.createdAt}
                message={msg.data.content}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t-[3px] border-primary bg-white relative">
        <div>
          <Input.TextArea
            ref={textareaRef}
            className="placeholder:!text-[#647491]"
            autoSize={{ maxRows: 25 }}
            placeholder="Write your message or type / to pick a Canned Response"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  return;
                }
                e.preventDefault();
                handleCreateMessage();
              }
            }}
            style={{
              fontSize: 16,
              border: 0,
              borderRadius: 0,
              boxShadow: 'unset',
              padding: '16px 64px 16px 14px',
            }}
          />
        </div>
        <div className="px-4 py-[10px] flex justify-between">
          <div></div>
          <Button
            className="h-[34px] border-none"
            type="primary"
            disabled={content.trim() === ''}
            onClick={handleCreateMessage}
          >
            Reply
          </Button>
        </div>

        {mask && (
          <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-[2px] flex justify-center items-center">
            <div>{mask}</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TextMessageProps {
  avatar?: ReactNode;
  username: string;
  createTime: number | string | Date;
  message: string;
}

function TextMessage({ avatar, username, createTime, message }: TextMessageProps) {
  return (
    <div className="flex px-[20px] my-[10px] hover:bg-[#f7f8fc]">
      <div className="pt-1">
        {avatar || <Avatar className="text-lg">{username.slice(0, 1)}</Avatar>}
      </div>
      <div className="ml-[14px]">
        <div className="flex items-center align-middle">
          <div className="text-sm font-medium">{username}</div>
          <div className="text-xs ml-[10px] text-[#647491]">
            {dayjs(createTime).format('h:mm A')}
          </div>
        </div>
        <div className="text-sm whitespace-pre">{message}</div>
      </div>
    </div>
  );
}

interface JoinConversationMaskProps {
  onJoin: () => void;
}

function JoinConversationMask({ onJoin }: JoinConversationMaskProps) {
  return (
    <div className="text-center">
      <Button type="primary" onClick={onJoin}>
        加入会话
      </Button>
      <div className="mt-3 text-sm">
        or press
        <span className="bg-[#f5f7f9] text-xs px-1.5 mx-1.5 border rounded">⏎ Enter</span>
        to start typing
      </div>
    </div>
  );
}
