import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Socket, io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

import { useEffectEvent } from './Panel/hooks/useEffectEvent';

const SocketContext = createContext<Socket | undefined>(undefined);

let version: string | undefined;

function onWelcome(data: { version?: string }) {
  if (version && version !== data.version) {
    toast(
      <div>
        检测到新版本，请
        <button className="text-primary" onClick={() => location.reload()}>
          刷新页面
        </button>
      </div>,
      { duration: Infinity },
    );
  } else {
    version = data.version;
  }
}

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
  const [evicted, setEvicted] = useState<{ message: string }>();

  const queryClient = useQueryClient();

  const onReconnect = useEffectEvent(() => {
    queryClient.invalidateQueries();

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

    socket.on('connect', onConnect);
    socket.on('welcome', onWelcome);
    socket.on('evict', setEvicted);
    socket.io.on('reconnect_attempt', onDisconnect);
    socket.io.on('reconnect', onReconnect);
  }, []);

  if (evicted) {
    return evicted.message;
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
