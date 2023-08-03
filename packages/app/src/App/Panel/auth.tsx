import { PropsWithChildren, createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Operator, getOperator } from './api/operator';

interface AuthContextValue {
  user?: Operator;
  setUser: (user: Operator) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Operator>();

  const { data } = useQuery({
    queryKey: ['Operator', 'me'],
    queryFn: () => getOperator('me'),
    suspense: true,
    useErrorBoundary: false,
  });

  return (
    <AuthContext.Provider value={{ user: user || data, setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth: auth is undefined');
  }
  return auth;
}
