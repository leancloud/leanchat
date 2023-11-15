import { useCallback, useMemo } from 'react';
import _ from 'lodash';

import { useOperators } from '@/Panel/hooks/operator';

export function useGetOperatorName() {
  const { data, isLoading } = useOperators();
  const operatorMap = useMemo(() => _.keyBy(data, (o) => o.id), [data]);
  const getOperatorName = useCallback(
    (id: string) => {
      if (isLoading) {
        return 'Loading';
      }
      return operatorMap[id]?.internalName;
    },
    [operatorMap, isLoading],
  );
  return { getOperatorName, isLoading };
}
