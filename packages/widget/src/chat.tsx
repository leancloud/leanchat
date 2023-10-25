import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Socket } from 'socket.io-client';

import { Conversation, EvaluateData, Message } from './types';
import { useAppContext } from './AppContext';

interface ChatContextValue {
  socket: Socket;
  status?: string;
  conversation?: Conversation;
  messages: Message[];
  sendMessage: (data: any) => void;
  evaluate: (data: EvaluateData) => void;
  close: () => void;
}

const ChatContext = createContext<ChatContextValue>(undefined as any);

function useEvent(socket: Socket, event: string, callback: (...args: any[]) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
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
  const { socket } = useAppContext();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
    };
    const onDisconnect = (_reason: string) => {
      setConnected(false);
    };
    const onMessage = (msg: Message) => {
      setMessages((messages) => [...messages, msg]);
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
    };
  }, [socket]);

  const [status, setStatus] = useState<string>();
  const [conversation, setConversation] = useState<Conversation>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEvent(socket, 'currentConversation', setConversation);
  useEvent(socket, 'initialized', (data) => {
    setStatus(data.status);
    if (data.conversation) {
      setConversation(data.conversation);
    }
    if (data.messages) {
      setMessages(data.messages);
    }
  });

  const sendMessage = useCallback(
    (data: any) => {
      if (status !== 'inService') {
        return;
      }
      socket.emit('message', data);
    },
    [status, socket],
  );

  const evaluate = useCallback(
    (evaluation: EvaluateData) => {
      socket.emit('evaluate', evaluation);
    },
    [socket],
  );

  const close = useCallback(() => {
    socket.emit('close');
  }, [socket]);

  if (!connected) {
    return;
  }

  return (
    <ChatContext.Provider
      value={{ socket, status, conversation, messages, sendMessage, evaluate, close }}
    >
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
        if (onInviteEvaluation && chatCtx.conversation && !chatCtx.conversation.evaluation) {
          onInviteEvaluation();
        }
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
