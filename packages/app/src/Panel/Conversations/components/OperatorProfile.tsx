import { Descriptions } from 'antd';

import { percent } from '@/Panel/helpers/percent';
import { useOperator } from '@/Panel/hooks/operator';

interface OperatorProfileProps {
  operatorId: string;
}

export function OperatorProfile({ operatorId }: OperatorProfileProps) {
  const { data: operator } = useOperator(operatorId);

  if (!operator) {
    return null;
  }

  return (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="用户名">{operator.username}</Descriptions.Item>
      <Descriptions.Item label="外部名">{operator.externalName}</Descriptions.Item>
      <Descriptions.Item label="当前会话数">{operator.workload}</Descriptions.Item>
      <Descriptions.Item label="同时接待量">{operator.concurrency}</Descriptions.Item>
      <Descriptions.Item label="负载">
        {percent(operator.workload, operator.concurrency)}
      </Descriptions.Item>
    </Descriptions>
  );
}
