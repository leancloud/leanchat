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

import { Conversation, EvaluateData, EvaluationTag, Message } from './types';
import { useAppContext } from './AppContext';

interface ChatContextValue {
  socket: Socket;
  connected: boolean;
  reconnecting: boolean;
  status?: string;
  conversation?: Conversation;
  messages: Message[];
  evaluationTag?: EvaluationTag;
  send: (data: any) => void;
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
  const { socket, iframe, emitter } = useAppContext();
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onReconnectAppempt = () => setReconnecting(true);
    const onReconnect = () => setReconnecting(false);
    const onMessage = (msg: Message) => {
      setMessages((messages) => [...messages, msg]);
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAppempt);
    socket.io.on('reconnect', onReconnect);
    socket.on('message', onMessage);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAppempt);
      socket.io.off('reconnect', onReconnect);
      socket.off('message', onMessage);
    };
  }, [socket]);

  const [status, setStatus] = useState<string>();
  const [conversation, setConversation] = useState<Conversation>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [evaluationTag, setEvaluationTag] = useState<EvaluationTag>();

  useEvent(socket, 'currentConversation', setConversation);
  useEvent(socket, 'initialized', (data) => {
    setStatus(data.status);
    setMessages(data.messages);
    setConversation(data.conversation);
    setEvaluationTag(data.evaluationTag);
    if (iframe.contentDocument) {
      const { style } = iframe.contentDocument.documentElement;
      style.setProperty('--color-primary', '#f60');
      style.setProperty('--color-text', '#fff');
    }
    emitter.emit('initialized');
  });

  const send = useCallback(
    (data: any) => {
      socket.emit('message', data);
    },
    [socket],
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

  return (
    <ChatContext.Provider
      value={{
        socket,
        connected,
        reconnecting,
        status,
        conversation,
        messages,
        evaluationTag,
        send,
        evaluate,
        close,
      }}
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
        if (onInviteEvaluation && chatCtx.conversation) {
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
