import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Modal, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { get, getOr, multiply } from 'lodash/fp';
import Papa from 'papaparse';

import { OperatorStats as OperatorStatsSchema, getOperatorStats } from '@/Panel/api/statistics';
import { BasicFilterForm, BasicFilterFormData } from '../components/BasicFilterForm';
import { useGetOperatorName } from '../hooks/useGetOperatorName';
import { divide, sum, subtract, flow, toSeconds, toPercent, downloadCSV } from '../helpers';
import { WorkingTime } from './WorkingTime';

export function OperatorStats() {
  const [formData, setFormData] = useState<BasicFilterFormData>({
    dateRange: [dayjs(), dayjs()],
  });

  const options = useMemo(
    () => ({
      from: formData.dateRange[0].startOf('day').toISOString(),
      to: formData.dateRange[1].endOf('day').toISOString(),
      channel: formData.channel,
      operatorId: formData.operatorId,
    }),
    [formData],
  );

  const { data, isFetching } = useQuery({
    queryKey: ['OperatorStats', options],
    queryFn: () => getOperatorStats(options),
  });

  const { getOperatorName } = useGetOperatorName();

  const columns: (ColumnType<OperatorStatsSchema> & {
    title: string;
    render: (row: any) => any;
  })[] = [
    {
      key: 'id',
      title: '客服ID',
      render: get('id'),
    },
    {
      key: 'operatorName',
      title: '客服名称',
      render: flow([get('id'), getOperatorName]),
    },
    {
      key: 'conversationTotalCount',
      title: '咨询总量',
      render: getOr(0, 'conversation.totalCount'),
    },
    {
      key: 'conversationValidCount',
      title: '有效会话量',
      render: getOr(0, 'conversation.validCount'),
    },
    {
      key: 'conversationInvalidCount',
      title: '无效会话量',
      render: getOr(0, 'conversation.invalidCount'),
    },
    {
      key: 'conversationOperatorNoResponseCount',
      title: '客服无应答量',
      render: getOr(0, 'conversation.operatorNoResponseCount'),
    },
    {
      key: 'transferIn',
      title: '人工转入会话',
      render: getOr(0, 'transferIn.count'),
    },
    {
      key: 'transferOut',
      title: '人工转出会话',
      render: getOr(0, 'transferOut.count'),
    },
    {
      key: 'averageFirstResponseTime',
      title: '平均首次响应时长(秒)',
      render: flow([get('conversation.averageFirstResponseTime'), toSeconds]),
    },
    {
      key: 'averageResponseTime',
      title: '平均响应时长(秒)',
      render: flow([
        divide(get('conversation.responseTime'), get('conversation.responseCount')),
        toSeconds,
      ]),
    },
    {
      key: 'maxResponseTime',
      title: '最长响应时间(秒)',
      render: flow([get('conversation.maxResponseTime'), toSeconds]),
    },
    {
      key: 'averageValidDuration',
      title: '平均会话时长(秒)',
      render: flow([
        divide(get('conversation.validDuration'), get('conversation.validCount')),
        toSeconds,
      ]),
    },
    {
      key: 'averageMessageCount',
      title: '平均消息条数',
      render: flow([
        divide(get('conversation.messageCount'), get('conversation.totalCount')),
        (avg: number) => avg.toFixed(2),
      ]),
    },
    {
      key: 'onlineTime',
      title: '登录时长(秒)',
      render: flow([get('online.totalTime'), multiply(60)]),
    },
    {
      key: 'readyTime',
      title: '在线时长(秒)',
      render: flow([get('online.readyTime'), multiply(60)]),
    },
    {
      key: 'busyTime',
      title: '忙碌时长(秒)',
      render: flow([get('online.busyTime'), multiply(60)]),
    },
    {
      key: 'postprocessingDuration',
      title: '后处理总时长(秒)',
      render: flow([getOr(0, 'postprocessing.duration'), toSeconds]),
    },
    {
      key: 'postprocessingCount',
      title: '后处理次数',
      render: getOr(0, 'postprocessing.count'),
    },
    {
      key: 'leaveTime',
      title: '离开时长(秒)',
      render: flow([get('online.leaveTime'), multiply(1000 * 60), toSeconds]),
    },
    {
      key: 'averageValidReceptionTime',
      title: '平均人工接待时长(秒)',
      render: flow([
        divide(get('conversation.validReceptionTime'), get('conversation.validCount')),
        toSeconds,
      ]),
    },
    {
      key: 'totalEvaluationCount',
      title: '评价总数',
      render: getOr(0, 'conversation.validEvaluationCount'),
    },
    {
      key: 'noEvaluationCount',
      title: '未评价总数',
      render: subtract(
        getOr(0, 'conversation.validCount'),
        getOr(0, 'conversation.validEvaluationCount'),
      ),
    },
    {
      key: 'evaluationPercentage',
      title: '参评率',
      render: flow([
        divide(get('conversation.validEvaluationCount'), get('conversation.validCount')),
        toPercent,
      ]),
    },
    {
      key: 'validEvaluationInvitationCount',
      title: '客服邀请量',
      render: getOr(0, 'conversation.validEvaluationInvitationCount'),
    },
    {
      key: 'evaluationInvitationPercentage',
      title: '客服邀请率',
      render: flow([
        divide(get('conversation.validEvaluationInvitationCount'), get('conversation.validCount')),
        toPercent,
      ]),
    },
    {
      key: 'negativeRate',
      title: '差评率',
      render: flow([
        divide(
          sum([get('conversation.evaluationStar1'), get('conversation.evaluationStar2')]),
          get('conversation.validEvaluationCount'),
        ),
        toPercent,
      ]),
    },
    {
      key: 'evaluationStar5',
      title: '非常满意量',
      render: getOr(0, 'conversation.evaluationStar5'),
    },
    {
      key: 'evaluationStar4',
      title: '满意量',
      render: getOr(0, 'conversation.evaluationStar4'),
    },
    {
      key: 'evaluationStar3',
      title: '一般量',
      render: getOr(0, 'conversation.evaluationStar3'),
    },
    {
      key: 'evaluationStar2',
      title: '不满意量',
      render: getOr(0, 'conversation.evaluationStar2'),
    },
    {
      key: 'evaluationStar1',
      title: '非常不满意量',
      render: getOr(0, 'conversation.evaluationStar1'),
    },
  ];

  const handleExport = () => {
    if (!data) {
      return;
    }
    const content = Papa.unparse({
      fields: columns.map((col) => col.title),
      data: data.map((row) => columns.map((col) => col.render(row))),
    });
    downloadCSV(content, '客服工作量统计.csv');
  };

  const [workingTimeOperatorId, setWorkingTimeOperatorId] = useState<string>();

  return (
    <>
      <div className="flex">
        <BasicFilterForm initData={formData} onChange={setFormData} />
        <Button className="ml-auto" onClick={handleExport}>
          导出
        </Button>
      </div>

      <Table
        style={{ marginTop: 20 }}
        dataSource={data}
        rowKey={(row) => row.id}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        columns={[
          ...columns,
          {
            key: 'workingTime',
            title: '工作时长',
            fixed: 'right',
            render: (operator) => <a onClick={() => setWorkingTimeOperatorId(operator.id)}>查看</a>,
          },
        ]}
      />

      <Modal
        title={`工作时长 - ${workingTimeOperatorId && getOperatorName(workingTimeOperatorId)}`}
        open={!!workingTimeOperatorId}
        onCancel={() => setWorkingTimeOperatorId(undefined)}
        width={800}
        footer={null}
      >
        <WorkingTime from={options.from} to={options.to} operatorId={workingTimeOperatorId} />
      </Modal>
    </>
  );
}
