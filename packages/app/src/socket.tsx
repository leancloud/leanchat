import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Socket, io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

import { useEffectEvent } from './Panel/hooks/useEffectEvent';

const SocketContext = createContext<Socket | undefined>(undefined);

interface SocketProviderProps {
  children?: ReactNode;
  fallback?: ReactNode;
  uri?: string;
  auth?: Record<string, any>;
}

export function SocketProvider({ children, fallback, uri, auth }: SocketProviderProps) {
  const socketRef = useRef<Socket>();
  const [connected, setConnected] = useState(false);
  const reconnectToastId = useRef<string>();
  const [evicted, setEvicted] = useState(false);

  const queryClient = useQueryClient();

  const onReconnect = useEffectEvent(() => {
    // 重新获取消息数据, 防止漏消息
    queryClient.invalidateQueries(['Messages']);

    if (reconnectToastId.current) {
      // 隐藏重连 toast
      toast.dismiss(reconnectToastId.current);
      reconnectToastId.current = undefined;
    }
  });

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(uri || '/', {
      transports: ['websocket'],
      auth,
    });

    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      if (!reconnectToastId.current) {
        reconnectToastId.current = toast.loading('与服务器失去连接, 正在重连...');
      }
    };
    const onEvict = () => {
      setEvicted(true);
    };

    socket.on('connect', onConnect);
    socket.on('evict', onEvict);
    socket.io.on('reconnect_attempt', onDisconnect);
    socket.io.on('reconnect', onReconnect);
  }, []);

  if (evicted) {
    return '您已在其他设备登录';
  }

  if (!connected) {
    return fallback;
  }

  return <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket: socket is undefined');
  }
  return socket;
}
