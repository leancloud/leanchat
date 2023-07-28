import { PropsWithChildren, createContext, useContext } from 'react';
import { useLocalStorage } from 'react-use';

interface User {
  id: string;
}

interface AuthContextValue {
  user?: User;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useLocalStorage<User>('LeanChat/operator');
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth: auth is undefined');
  }
  return auth;
}
