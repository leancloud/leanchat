import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocalStorage } from 'react-use';
import { Socket, io } from 'socket.io-client';
import { nanoid } from 'nanoid';

import { Conversation, EvaluateData, Message } from './types';

interface ChatContextValue {
  socket: Socket;
  conversation?: Conversation;
  messages: Message[];
  sendMessage: (content: string) => void;
  evaluate: (data: EvaluateData) => void;
}

const ChatContext = createContext<ChatContextValue>(undefined as any);

const VISITOR_ID = nanoid();

function useEvent(socket: Socket | undefined, event: string, callback: (...args: any[]) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!socket) return;
    const callback = (...args: any[]) => callbackRef.current(...args);
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);
}

interface ChatProps {
  children?: ReactNode;
}

export function Chat({ children }: ChatProps) {
  const [visitorId] = useLocalStorage('LeanChat/visitorId', VISITOR_ID, { raw: true });

  const [socket, setSocket] = useState<Socket>();
  const [connected, setConnected] = useState(false);

  const socketInited = useRef(false);

  useEffect(() => {
    if (socketInited.current) return;
    socketInited.current = true;
    const socket = io({
      transports: ['websocket'],
      auth: {
        id: visitorId,
      },
    });
    setSocket(socket);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      setConnected(true);
    };
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (content: string) => {
      socket?.emit('message', {
        data: {
          type: 'text',
          content,
        },
      });
    },
    [socket],
  );

  const [conversation, setConversation] = useState<Conversation>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEvent(socket, 'currentConversation', setConversation);
  useEvent(socket, 'messages', setMessages);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: Message) => {
      setMessages((messages) => [...messages, msg]);
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [socket]);

  const evaluate = useCallback(
    (evaluation: EvaluateData) => {
      socket?.emit('evaluate', evaluation);
      setConversation((conv) => {
        if (conv) {
          return { ...conv, evaluation };
        }
      });
    },
    [socket],
  );

  if (!socket || !connected) {
    return;
  }

  return (
    <ChatContext.Provider value={{ socket, conversation, messages, sendMessage, evaluate }}>
      {children}
    </ChatContext.Provider>
  );
}

function useEffectEvent<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

interface UseChatOptions {
  onInviteEvaluation?: () => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { onInviteEvaluation } = options;

  const chatCtx = useContext(ChatContext);

  const { socket } = chatCtx;

  const anyListener = useEffectEvent((event: string) => {
    switch (event) {
      case 'inviteEvaluation':
        onInviteEvaluation?.();
        break;
    }
  });

  useEffect(() => {
    socket.onAny(anyListener);
    return () => {
      socket.offAny(anyListener);
    };
  }, []);

  return chatCtx;
}
