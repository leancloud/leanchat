import { ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import { useLocalStorage } from 'react-use';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  id: string;
}

export const AuthContext = createContext<User | undefined>(undefined);

interface AuthProviderProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

export function AuthProvider({ children, fallback }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User>('LeanChat/customer');

  const { mutate } = useMutation({
    mutationFn: async () => {
      const res = await axios.post<User>(`/api/v1/customers`);
      return res.data;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });

  const inited = useRef(false);
  useEffect(() => {
    if (!user && !inited.current) {
      mutate();
      inited.current = true;
    }
  }, []);

  if (!user) {
    return fallback;
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(AuthContext);
  if (!user) {
    throw new Error('useCurrentUser: user is undefined');
  }
  return user;
}
