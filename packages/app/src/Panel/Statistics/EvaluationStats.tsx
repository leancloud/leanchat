import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { BasicFilterForm, BasicFilterFormData } from './components/BasicFilterForm';
import {
  EvaluationStats as EvaluationStatsSchema,
  GetEvaluationStatsOptions,
  getEvaluationStats,
} from '../api/statistics';
import { getEvaluationStarText } from './utils';
import { useOperators } from '../hooks/operator';
import { useGetOperatorName } from '../Quality';

export function EvaluationStats() {
  const [formData, setFormData] = useState<BasicFilterFormData>({
    dateRange: [dayjs(), dayjs()],
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const options = useMemo<GetEvaluationStatsOptions>(
    () => ({
      from: formData.dateRange[0].startOf('day').toDate(),
      to: formData.dateRange[1].endOf('day').toDate(),
      channel: formData.channel,
      operatorId: formData.operatorId,
      page,
      pageSize,
    }),
    [formData, page, pageSize],
  );

  const { data, isFetching } = useQuery({
    queryKey: ['EvaluationStats', options],
    queryFn: () => getEvaluationStats(options),
  });

  const { data: operators } = useOperators();
  const getOperatorName = useGetOperatorName(operators);

  const columns: ColumnsType<EvaluationStatsSchema> = [
    {
      dataIndex: 'id',
      title: '会话ID',
    },
    {
      dataIndex: ['evaluation', 'createdAt'],
      title: '评价时间',
      render: (dateString: string) => dayjs(dateString).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      key: 'evaluationType',
      title: '评价类型',
      render: (stats: EvaluationStatsSchema) => {
        if (stats.evaluationInvitedAt) {
          return '邀请评价';
        } else {
          return '主动评价';
        }
      },
    },
    {
      key: 'operatorName',
      title: '客服名称',
      render: (stats: EvaluationStatsSchema) => {
        if (!stats.operatorId) {
          return '-';
        }
        return getOperatorName(stats.operatorId);
      },
    },
    {
      dataIndex: 'visitorName',
      title: '用户名称',
      render: (name: string | undefined) => name ?? '-',
    },
    {
      dataIndex: 'visitorId',
      title: '用户ID',
    },
    {
      dataIndex: ['evaluation', 'star'],
      title: '满意度',
      render: getEvaluationStarText,
    },
    {
      dataIndex: ['evaluation', 'feedback'],
      title: '评价标签',
      render: (feedback: string) => feedback || '-',
    },
  ];

  return (
    <>
      <BasicFilterForm initData={formData} onChange={setFormData} />

      <Table
        className="mt-5"
        dataSource={data?.items}
        rowKey={(row) => row.id}
        loading={isFetching}
        pagination={{
          total: data?.totalCount,
          current: page,
          pageSize,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ x: 'max-content' }}
        columns={columns}
      />
    </>
  );
}
