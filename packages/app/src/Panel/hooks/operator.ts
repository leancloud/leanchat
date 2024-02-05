import { useEffect } from 'react';
import { UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';

import { GetOperatorsOptions, getOperator, getOperators } from '@/Panel/api/operator';
import { Operator } from '@/Panel/types';
import { useAuthContext } from '../auth';

interface OperatorStatusChangedEvent {
  operatorId: string;
  status: number;
}

export interface UseOperatorsOptions extends GetOperatorsOptions {
  queryOptions?: UseQueryOptions<Operator[]>;
}

export function useOperators({ queryOptions, inactive = false }: UseOperatorsOptions = {}) {
  return useQuery({
    queryKey: ['Operators', { inactive }],
    queryFn: () => getOperators({ inactive }),
    staleTime: 1000 * 60 * 5,
    ...queryOptions,
  });
}

export function useOperator(operatorId: string) {
  return useQuery({
    queryKey: ['Operator', operatorId],
    queryFn: () => getOperator(operatorId),
  });
}

export function useSubscribeOperatorsStatus(socket: Socket) {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthContext();

  useEffect(() => {
    const onOperatorStatusChanged = (e: OperatorStatusChangedEvent) => {
      queryClient.setQueryData<Operator[] | undefined>(['Operators'], (data) => {
        if (!data) return;
        return produce(data, (operators) => {
          for (const operator of operators) {
            if (operator.id === e.operatorId) {
              operator.status = e.status;
              break;
            }
          }
        });
      });
      if (user && e.operatorId === user.id) {
        setUser({ ...user, status: e.status });
      }
    };
    socket.on('operatorStatusChanged', onOperatorStatusChanged);
    return () => {
      socket.off('operatorStatusChanged', onOperatorStatusChanged);
    };
  }, [socket, queryClient]);
}
