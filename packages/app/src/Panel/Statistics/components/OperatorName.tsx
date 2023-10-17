import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import _ from 'lodash';

import { useOperators } from '@/Panel/hooks/operator';
import { Operator } from '@/Panel/types';

interface OperatorContextValue {
  operatorMap: Record<string, Operator>;
}

const OperatorContext = createContext<OperatorContextValue>({
  operatorMap: {},
});

export function OperatorNameProvider({ children }: PropsWithChildren) {
  const { data: operators } = useOperators();
  const operatorMap = useMemo(() => _.keyBy(operators, (o) => o.id), [operators]);

  return <OperatorContext.Provider value={{ operatorMap }}>{children}</OperatorContext.Provider>;
}

interface OperatorNameProps {
  operatorId: string;
}

export function OperatorName({ operatorId }: OperatorNameProps) {
  const { operatorMap } = useContext(OperatorContext);
  const operator = operatorMap[operatorId];
  if (operator) {
    return `${operator.externalName}(${operator.internalName})`;
  }
}
