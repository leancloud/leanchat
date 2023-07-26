import { ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import AV from '@/leancloud';
import { useLocalStorage } from 'react-use';

interface User {
  id: string;
  sessionToken: string;
}

export const AuthContext = createContext<User | undefined>(undefined);

interface AuthProviderProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

export function AuthProvider({ children, fallback }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User | undefined>('LeanChat/visitor');

  const loading = useRef(false);
  useEffect(() => {
    if (user || loading.current) {
      return;
    }
    loading.current = true;
    AV.User.loginAnonymously().then((user) =>
      setUser({
        id: user.id!,
        sessionToken: user.getSessionToken(),
      })
    );
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
