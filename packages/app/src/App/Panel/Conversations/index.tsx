import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Avatar, Badge, Button, Divider, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import cx from 'classnames';
import _ from 'lodash';

import { Conversation } from '@/api/conversation';
import { Message } from '@/api/message';
import { callRpc, useEvent, useSocket, useSubscribeConversation } from '@/socket';
import { useAuth } from '../auth';
import { CustomSider } from '../Layout';
import { diffTime } from './utils';
import { useUnassignedCount } from './states';
import { NavButton, NavMenu } from '../components/NavMenu';

interface MessageGroup {
  date: Date;
  messages: Message[];
}

export default function Conversations() {
  const { user } = useAuth();
  const socket = useSocket();

  const [stream, setStream] = useState('myOpen');

  const getConvOptions = useMemo(() => {
    switch (stream) {
      case 'unassigned':
        return { operatorId: null };
      case 'myOpen':
        return { operatorId: user!.id };
      case 'solved':
        return { isSolved: true };
    }
  }, [stream, user]);

  const [currentConv, setCurrentConv] = useState<Conversation>();

  const handleChangeConversation = (conv: Conversation) => {
    setCurrentConv(conv);
  };

  const handleJoinCurrentConversation = async () => {
    if (!currentConv) return;
    const conv = await callRpc(socket, 'joinConversation', currentConv.id);
    setStream('myOpen');
    setCurrentConv(conv);
  };

  return (
    <>
      <CustomSider>
        <Sider
          stream={stream}
          onChangeStream={setStream}
          conversations={[]}
          onClickConversation={handleChangeConversation}
          activeConversationId={currentConv?.id}
        />
      </CustomSider>

      {currentConv && (
        <ChatBox
          conversation={currentConv}
          mask={
            currentConv &&
            !currentConv.assignee && <JoinConversationMask onJoin={handleJoinCurrentConversation} />
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
  const [unassignedCount] = useUnassignedCount();

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
        <Avatar className="shrink-0">{conv.creator.id.slice(0, 1)}</Avatar>
        <div className="ml-[10px] grow overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate">{conv.creator.id}</div>
            {conv.recentMessage && (
              <div className="text-xs ml-auto shrink-0">
                {diffTime(now, conv.recentMessage.createTime)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#647491]">Live chat</div>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <div className="text-sm mr-auto">{conv.recentMessage?.text}</div>
        {conv.assignee && <Avatar size={18} icon={<UserOutlined />} />}
      </div>
    </div>
  ));
}

interface ChatBoxProps {
  conversation: Conversation;
  mask?: ReactNode;
}

function ChatBox({ conversation, mask }: ChatBoxProps) {
  const { user } = useAuth();
  const socket = useSocket();

  useSubscribeConversation(conversation.id);

  const { data: historyMessages } = useInfiniteQuery<Message[]>({
    queryKey: ['Messages', conversation.id],
    queryFn: () => {
      return callRpc(socket, 'getTimeline', {
        cid: conversation.id,
        type: ['message'],
      });
    },
  });

  const historyMessageGroups = useMemo(() => {
    const groups: MessageGroup[] = [];
    historyMessages?.pages.forEach((messages) => {
      messages.forEach((msg) => {
        const msgDate = dayjs(msg.createTime).startOf('day');
        const currentGroup = _.last(groups);
        if (currentGroup) {
          if (dayjs(currentGroup.date).isSame(msgDate)) {
            currentGroup.messages.push(msg);
          } else {
            groups.push({ date: msgDate.toDate(), messages: [msg] });
          }
        } else {
          groups.push({ date: msgDate.toDate(), messages: [msg] });
        }
      });
    });
    return groups;
  }, [historyMessages]);

  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => setMessages([]), [conversation]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [historyMessageGroups, messages]);

  const handleCreateMessage = async () => {
    const trimedContent = content.trim();
    if (!trimedContent) {
      return;
    }
    const msg = await callRpc(socket, 'sendMessage', {
      cid: conversation.id,
      text: trimedContent,
    });
    setMessages((msgs) => msgs.concat(msg));
    setContent('');
    textareaRef.current?.focus();
  };

  const convId = useRef(conversation.id);
  convId.current = conversation.id;

  useEffect(() => {
    const onMessage = (msg: Message) => {
      if (msg.cid !== convId.current) {
        return;
      }
      setMessages((msgs) => msgs.concat(msg));
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, []);

  const messageDivider = useMemo(() => {
    if (historyMessageGroups.length && messages.length) {
      const lastGroup = _.last(historyMessageGroups)!;
      const firstMessageDate = dayjs(messages[0].createTime).startOf('day');
      if (!firstMessageDate.isSame(lastGroup.date)) {
        return firstMessageDate.format('MMM DD, YYYY');
      }
    }
  }, [historyMessageGroups, messages]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div ref={messageContainerRef} className="mt-auto overflow-y-auto">
        {historyMessageGroups.map(({ date, messages }) => (
          <div key={date.getTime()}>
            <Divider style={{ margin: '10px 20px', fontSize: 14 }}>
              {dayjs(date).format('MMM DD, YYYY')}
            </Divider>
            {messages.map((msg) => (
              <TextMessage
                key={msg.id}
                avatar={<Avatar icon={<UserOutlined />} />}
                username={msg.uid === user!.id ? 'You' : msg.uid}
                createTime={msg.createTime}
                message={msg.text}
              />
            ))}
          </div>
        ))}

        {messageDivider && (
          <Divider style={{ margin: '10px 20px', fontSize: 14 }}>{messageDivider}</Divider>
        )}

        {messages.map((msg) => (
          <TextMessage
            key={msg.id}
            avatar={<Avatar icon={<UserOutlined />} />}
            username={msg.uid === user!.id ? 'You' : msg.uid}
            createTime={msg.createTime}
            message={msg.text}
          />
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
        Join conversation
      </Button>
      <div className="mt-3 text-sm">
        or press
        <span className="bg-[#f5f7f9] text-xs px-1.5 mx-1.5 border rounded">⏎ Enter</span>
        to start typing
      </div>
    </div>
  );
}
