import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Socket, io } from 'socket.io-client';

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

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(uri || '/', {
      transports: ['websocket'],
      auth,
    });

    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onReconnect = () => {
      if (!reconnectToastId.current) {
        reconnectToastId.current = toast.loading('与服务器失去连接, 正在重连...');
      }
    };
    const onReconnected = () => {
      if (reconnectToastId.current) {
        toast.dismiss(reconnectToastId.current);
        reconnectToastId.current = undefined;
      }
    };
    const onEvict = () => {
      setEvicted(true);
    };

    socket.on('connect', onConnect);
    socket.on('evict', onEvict);
    socket.io.on('reconnect_attempt', onReconnect);
    socket.io.on('reconnect', onReconnected);
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
