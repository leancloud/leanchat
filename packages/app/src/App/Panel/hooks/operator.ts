import { useQuery } from '@tanstack/react-query';

import { getOperators } from '@/App/Panel/api/operator';

export function useOperators() {
  return useQuery({
    queryKey: ['Operators'],
    queryFn: getOperators,
    staleTime: 1000 * 60 * 5,
  });
}
