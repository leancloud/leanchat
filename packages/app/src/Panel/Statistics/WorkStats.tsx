import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { Pie, PieConfig } from '@ant-design/plots';
import _ from 'lodash';

import { getWorkStats } from '../api/statistics';
import { useOperators } from '../hooks/operator';
import { OperatorStatus } from '../types';
import { StatsCard } from './components/StatsCard';
import { renderTime } from './helpers';

const statusColors = ['#34b857', '#ffaf3d', '#e81332'];

function OperatorPie() {
  const { data: operators } = useOperators({
    queryOptions: {
      staleTime: 0,
    },
    inactive: false,
  });

  const operatorByStatus = useMemo(() => {
    const initValue = {
      [OperatorStatus.Ready]: 0,
      [OperatorStatus.Busy]: 0,
      [OperatorStatus.Leave]: 0,
    };
    return (operators || []).reduce((map, operator) => {
      map[operator.status] += 1;
      return map;
    }, initValue);
  }, [operators]);

  const config: PieConfig = {
    data: [
      { type: '在线客服数', value: operatorByStatus[OperatorStatus.Ready] },
      { type: '忙碌客服数', value: operatorByStatus[OperatorStatus.Busy] },
      { type: '离开客服数', value: operatorByStatus[OperatorStatus.Leave] },
    ],
    angleField: 'value',
    colorField: 'type',
    tooltip: false,
    style: {
      fill: (_d: any, index: number) => statusColors[index],
    },
    label: {
      text: (d: { value: number }) => (d.value ? `${d.value} 人` : ''),
    },
    legend: {
      color: {
        position: 'bottom',
        itemMarkerFill: (_datum: any, index: number) => statusColors[index],
      },
    },
  };
  return <Pie {...config} />;
}

export function WorkStats() {
  const { data } = useQuery({
    queryKey: ['WorkStats'],
    queryFn: getWorkStats,
  });

  if (!data) {
    return <Spin />;
  }

  return (
    <div className="flex items-center gap-10">
      <div className="space-y-2">
        <div className="flex gap-2">
          <StatsCard title="当前会话数" value={data.openCount} />
          <StatsCard title="累计会话数" value={data.totalCount} />
        </div>
        <div className="flex gap-2">
          <StatsCard title="当前排队数" value={data.queueLength} />
          <StatsCard
            title="最长排队时间"
            value={data.maxQueueingTime ? renderTime(data.maxQueueingTime) : '-'}
          />
        </div>
      </div>
      <div style={{ width: 400, height: 400 }}>
        <OperatorPie />
      </div>
    </div>
  );
}
