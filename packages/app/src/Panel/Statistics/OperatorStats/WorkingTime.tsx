import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableProps } from 'antd';

import { OperatorWorkingTime, getOperatorWorkingTime } from '@/Panel/api/statistics';
import { formatDate, renderTime } from '../helpers';
import * as render from '../render';

const columns: TableProps<OperatorWorkingTime>['columns'] = [
  {
    dataIndex: 'startTime',
    title: '开始时间',
    render: formatDate,
  },
  {
    dataIndex: 'endTime',
    title: '结束时间',
    render: formatDate,
  },
  {
    dataIndex: 'duration',
    title: '时长',
    render: renderTime,
  },
  {
    dataIndex: 'ip',
    title: 'IP',
  },
  {
    dataIndex: 'status',
    title: '状态',
    render: render.status,
  },
];

interface WorkingTimeProps {
  from: string;
  to: string;
  operatorId?: string;
}

export function WorkingTime({ from, to, operatorId }: WorkingTimeProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    enabled: !!operatorId,
    queryKey: ['OperatorWorkingTime', { from, to, operatorId, page }],
    queryFn: () =>
      getOperatorWorkingTime({
        operatorId: operatorId!,
        from,
        to,
        page,
        pageSize,
      }),
  });

  return (
    <Table
      columns={columns}
      loading={isLoading}
      dataSource={data?.data}
      rowKey={(item) => item.id}
      pagination={{
        current: page,
        pageSize,
        onChange: setPage,
        total: data?.totalCount,
      }}
    />
  );
}
