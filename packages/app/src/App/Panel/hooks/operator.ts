import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { produce } from 'immer';

import { getOperators } from '@/App/Panel/api/operator';
import { Operator } from '@/App/Panel/types';

interface OperatorStatusChangedEvent {
  operatorId: string;
  status: string;
}

export function useOperators() {
  return useQuery({
    queryKey: ['Operators'],
    queryFn: getOperators,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubscribeOperatorsStatus(socket: Socket) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const onOperatorStatusChanged = (e: OperatorStatusChangedEvent) => {
      queryClient.setQueryData<Operator[] | undefined>(['Operators'], (data) => {
        if (!data) return;
        return produce(data, (operators) => {
          operators.forEach((operator) => {
            if (operator.id === e.operatorId) {
              operator.status = e.status;
            }
          });
        });
      });
    };
    socket.on('operatorStatusChanged', onOperatorStatusChanged);
    return () => {
      socket.off('operatorStatusChanged', onOperatorStatusChanged);
    };
  }, [socket, queryClient]);
}
