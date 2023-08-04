import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

import { Operator, getOperator } from './api/operator';

interface AuthContextValue {
  user?: Operator;
  setUser: (user: Operator) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Operator>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    getOperator('me').then(setUser).catch(setError);
  }, []);

  if (!user && !error) {
    return null;
  }

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth: auth is undefined');
  }
  return auth;
}
