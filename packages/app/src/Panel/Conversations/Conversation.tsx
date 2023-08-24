import { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, message } from 'antd';
import _ from 'lodash';

import { callRpc, useEvent, useSocket } from '@/socket';
import { useCurrentUser } from '@/Panel/auth';
import { useConversation, useConversationMessages } from '@/Panel/hooks/conversation';
import { Message } from '@/Panel/types';
import { ConversationDetail } from './ConversationDetail';
import { ConversationContext } from './ConversationContext';
import { MessageList } from './MessageList';

interface ConversationProps {
  conversationId: string;
  showDetail: boolean;
  onToggleDetail: () => void;
}

export function Conversation({ conversationId, showDetail, onToggleDetail }: ConversationProps) {
  const user = useCurrentUser();
  const socket = useSocket();

  const { data: conversation } = useConversation(conversationId);

  const { data: remoteMessages } = useConversationMessages(conversationId);

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (remoteMessages && messages.length === 0) {
      setMessages(remoteMessages);
    }
  }, [remoteMessages, messages]);

  useEvent(socket, 'message', (message: Message) => {
    if (message.conversationId === conversationId) {
      setMessages((prev) => [...prev, message]);
    }
  });

  const [content, setContent] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateMessage = async () => {
    const trimedContent = content.trim();
    if (!trimedContent) {
      return;
    }
    socket.emit('message', {
      conversationId,
      data: {
        type: 'text',
        content: trimedContent,
      },
    });
    setContent('');
    textareaRef.current?.focus();
  };

  const { mutate: joinConversation } = useMutation({
    mutationFn: () => {
      return callRpc(socket, 'assignConversation', {
        conversationId,
        operatorId: user!.id,
      });
    },
  });

  const { mutate: closeConversation } = useMutation({
    mutationFn: () => {
      return callRpc(socket, 'closeConversation', { conversationId });
    },
  });

  const { mutate: inviteEvaluation } = useMutation({
    mutationFn: () => {
      return callRpc(socket, 'inviteEvaluation', { conversationId });
    },
    onSuccess: () => {
      message.info('评价邀请已发送');
    },
  });

  if (!conversation) {
    return;
  }

  return (
    <ConversationContext.Provider value={{ conversation }}>
      <div className="h-full flex">
        <div className="h-full flex flex-col overflow-hidden relative grow">
          <div ref={messageContainerRef} className="mt-auto overflow-y-auto">
            <MessageList messages={messages} />
          </div>
          <div className="border-t-[3px] border-primary bg-white relative">
            <div className="px-2 py-1 border-b space-x-1">
              <Button size="small" onClick={() => closeConversation()}>
                结束会话
              </Button>
              <Button size="small" onClick={() => inviteEvaluation()}>
                邀请评价
              </Button>
            </div>
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

            {!conversation.operatorId && (
              <Mask>
                <JoinConversationMask onJoin={joinConversation} />
              </Mask>
            )}

            {conversation.operatorId && conversation.operatorId !== user.id && (
              <Mask>
                <div>
                  <Button type="primary" onClick={() => joinConversation()}>
                    抢接会话
                  </Button>
                </div>
              </Mask>
            )}

            {conversation.status === 'solved' && <Mask>会话已结束</Mask>}
          </div>

          <button
            className="absolute top-0 right-0 bg-[#e2e8ef] h-[34px] text-xs px-2 rounded-bl-lg text-primary"
            onClick={() => onToggleDetail()}
          >
            会话详情
          </button>
        </div>

        <ConversationDetail show={showDetail} />
      </div>
    </ConversationContext.Provider>
  );
}

function Mask({ children }: PropsWithChildren) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-[2px] flex justify-center items-center">
      {children}
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
