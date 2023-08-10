import { PropsWithChildren, createContext, useContext, useState } from 'react';
import axios from 'axios';

import { Operator } from './types';
import { getOperator } from './api/operator';
import { useEffectOnce } from './hooks/useEffectOnce';
import { useUserStatus } from './states/user';

interface AuthContextValue {
  user?: Operator;
  setUser: (user: Operator | undefined) => void;
}

const AuthContext = createContext<AuthContextValue>(undefined as any);

async function getCurrentUser() {
  try {
    return await getOperator('me');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return;
    }
    throw error;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Operator>();
  const [settled, setSettled] = useState(false);

  const [, setStatus] = useUserStatus();

  useEffectOnce(() => {
    getCurrentUser()
      .then((user) => {
        if (user) {
          setUser(user);
          setStatus(user.status);
        }
      })
      .finally(() => setSettled(true));
  });

  if (!settled) {
    return;
  }

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function useCurrentUser() {
  const { user } = useAuthContext();
  if (!user) {
    throw new Error('useCurrentUser: user is undefined');
  }
  return user;
}
