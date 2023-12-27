import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createOperatorGroup,
  deleteOperatorGroup,
  getOperatorGroup,
  getOperatorGroups,
  updateOperatorGroup,
} from '../api/operator-group';

export function useOperatorGroups() {
  return useQuery({
    queryKey: ['OperatorGroups'],
    queryFn: getOperatorGroups,
    staleTime: Infinity,
    cacheTime: Infinity,
  });
}

export function useOperatorGroup(id: string) {
  return useQuery({
    queryKey: ['OperatorGroup', id],
    queryFn: () => getOperatorGroup(id),
  });
}

export function useInvalidateOperatorGroups() {
  const queryClient = useQueryClient();
  return useCallback(
    (id?: string) => {
      queryClient.invalidateQueries(['OperatorGroups']);
      if (id) {
        queryClient.invalidateQueries(['OperatorGroup', id]);
      }
    },
    [queryClient],
  );
}

export function useCreateOperatorGroup() {
  const invalidate = useInvalidateOperatorGroups();
  return useMutation({
    mutationFn: createOperatorGroup,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateOperatorGroup() {
  const invalidate = useInvalidateOperatorGroups();
  return useMutation({
    mutationFn: updateOperatorGroup,
    onSuccess: (group) => invalidate(group.id),
  });
}

export function useDeleteOperatorGroup() {
  const invalidate = useInvalidateOperatorGroups();
  return useMutation({
    mutationFn: deleteOperatorGroup,
    onSuccess: (_group, id) => invalidate(id),
  });
}
