import { useOperators } from '@/Panel/hooks/operator';
import { useMemo } from 'react';

export function useOperatorName(id: string) {
  const { data: operators } = useOperators();
  return useMemo(() => {
    const operator = operators?.find((o) => o.id === id);
    return operator ? operator.internalName : '客服(已删除)';
  }, [id, operators]);
}
