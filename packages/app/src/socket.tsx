import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (socketRef.current) {
      return;
    }
    const socket = io(uri || '/', {
      transports: ['websocket'],
      auth,
    });
    socket.on('connect', () => setConnected(true));
    socketRef.current = socket;
  }, []);

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
