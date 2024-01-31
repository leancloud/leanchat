import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Modal, Progress, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import _ from 'lodash';
import { cond, constant, get, has, join, stubTrue } from 'lodash/fp';

import { BasicFilterForm, BasicFilterFormData } from './components/BasicFilterForm';
import {
  EvaluationStats as EvaluationStatsSchema,
  GetEvaluationStatsOptions,
  getEvaluationStats,
} from '../api/statistics';
import { evaluationStar } from './render';
import { useExportData } from '../hooks/useExportData';
import { downloadCSV, flow, formatDate, percent } from './helpers';
import { useOperators } from '../hooks/operator';
import { useSelector } from '../hooks/useSelector';

export interface ExportDataColumn {
  key: string;
  title: string;
  render: (value: any) => any;
}

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
  const getOperatorName = useSelector(operators, 'id', 'internalName');

  const columns: (ColumnType<EvaluationStatsSchema> & ExportDataColumn)[] = [
    {
      key: 'id',
      title: '会话ID',
      render: get('id'),
    },
    {
      key: 'createdAt',
      title: '评价时间',
      render: flow([get('evaluation.createdAt'), formatDate]),
    },
    {
      key: 'evaluationType',
      title: '评价类型',
      render: cond([
        [has('evaluationInvitedAt'), constant('邀请评价')],
        [stubTrue, constant('主动评价')],
      ]),
    },
    {
      key: 'operatorName',
      title: '客服名称',
      render: flow([get('operatorId'), getOperatorName]),
    },
    {
      key: 'visitorName',
      title: '用户名称',
      render: get('visitorName'),
    },
    {
      key: 'visitorId',
      title: '用户ID',
      render: get('visitorId'),
    },
    {
      key: 'evaluationStar',
      title: '满意度',
      render: evaluationStar,
    },
    {
      key: 'tags',
      title: '评价标签',
      render: flow([get('evaluation.tags'), join(',')]),
    },
    {
      key: 'feedback',
      title: '评价内容',
      render: get('evaluation.feedback'),
    },
  ];

  const [exportedCount, setExportedCount] = useState(0);

  const {
    exportData,
    cancel,
    isLoading: isExporting,
  } = useExportData({
    fetchData: (cursor) => {
      return getEvaluationStats({
        ...options,
        page: 1,
        pageSize: 1000,
        from: cursor || options.from,
      });
    },
    getNextCursor: (lastData) => {
      if (lastData.items.length < 1000) {
        return;
      }
      const lastItem = _.last(lastData.items);
      if (lastItem) {
        return dayjs(lastItem.createdAt).add(1, 'ms').toDate();
      }
    },
    onProgress: ({ items }) => {
      setExportedCount((count) => count + items.length);
    },
    onSuccess: (data) => {
      const rows = data
        .flatMap((t) => t.items)
        .map((item) => columns.map((col) => col.render(item)));
      const content = Papa.unparse({
        fields: columns.map((col) => col.title),
        data: rows,
      });
      downloadCSV(content, '满意度评价统计.csv');
    },
  });

  const handleExport = () => {
    if (!data) {
      return;
    }
    if (data.totalCount > 10000) {
      return alert('导出数据量过大，请缩小检索范围');
    }
    setExportedCount(0);
    exportData();
  };

  return (
    <>
      <div className="flex">
        <BasicFilterForm initData={formData} onChange={setFormData} />
        <Button
          className="ml-auto"
          disabled={!data || data.totalCount === 0}
          onClick={handleExport}
        >
          导出
        </Button>
      </div>

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

      <Modal
        open={isExporting}
        title="导出进度"
        closable={false}
        maskClosable={false}
        footer={<Button onClick={cancel}>取消</Button>}
      >
        {data && (
          <>
            <Progress percent={percent(exportedCount, data.totalCount)} />
            <div className="text-center">1 / 100</div>
          </>
        )}
      </Modal>
    </>
  );
}
