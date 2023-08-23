import { useCallback, useEffect, useState } from 'react';

import { useSocket } from '@/socket';

interface Message {
  id: string;
  type: string;
  from: {
    type: string;
    id: string;
  };
  data: {
    type: 'text';
    content: string;
  };
  createdAt: string;
}

export function useSendMessage() {
  const socket = useSocket();
  return useCallback(
    (content: string) => {
      socket.emit('message', {
        data: {
          type: 'text',
          content,
        },
      });
    },
    [socket],
  );
}

export function useMessages() {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socket.emit('getHistory', (res: { result?: Message[] }) => {
      const messages = res.result;
      if (messages) {
        setMessages(messages);
      }
    });
  }, [socket]);

  useEffect(() => {
    const onMessage = (msg: Message) => {
      setMessages((messages) => [...messages, msg]);
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [socket]);

  return { messages };
}
