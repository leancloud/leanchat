import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import _ from 'lodash';

import { BasicFilterForm, BasicFilterFormData } from './components/BasicFilterForm';
import { OperatorStats as OperatorStatsSchema, getOperatorStats } from '../api/statistics';
import {
  add,
  defaultValue,
  divide,
  fixed,
  flow,
  multiply,
  percent,
  push,
  pushValue,
  subtract,
  timeDuration,
} from './utils';
import { OperatorName, OperatorNameProvider } from './components/OperatorName';

const columns: ColumnsType<OperatorStatsSchema> = [
  {
    dataIndex: 'id',
    title: '客服ID',
  },
  {
    key: 'operatorName',
    dataIndex: 'id',
    title: '客服名称',
    render: (id) => <OperatorName operatorId={id} />,
  },
  {
    dataIndex: ['conversation', 'totalCount'],
    title: '咨询总量',
    render: (value) => value ?? 0,
  },
  {
    dataIndex: ['conversation', 'validCount'],
    title: '有效会话量',
    render: (value) => value ?? 0,
  },
  {
    dataIndex: ['conversation', 'invalidCount'],
    title: '无效会话量',
    render: (value) => value ?? 0,
  },
  {
    dataIndex: ['conversation', 'operatorNoResponseCount'],
    title: '客服无应答量',
    render: (value) => value ?? 0,
  },
  {
    key: 'transferIn',
    title: '人工转入会话',
    render: flow(push('transferIn.count'), defaultValue(0)),
  },
  {
    key: 'transferOut',
    title: '人工转出会话',
    render: flow(push('transferOut.count'), defaultValue(0)),
  },
  {
    key: 'averageFirstResponseTime',
    title: '平均首次响应时长',
    render: flow(push('conversation.averageFirstResponseTime'), timeDuration()),
  },
  {
    key: 'averageResponseTime',
    title: '平均响应时长',
    render: flow(
      push('conversation.responseTime'),
      push('conversation.responseCount'),
      divide(),
      timeDuration(),
    ),
  },
  {
    key: 'maxResponseTime',
    title: '最长响应时间',
    render: flow(push('conversation.maxResponseTime'), timeDuration()),
  },
  {
    key: 'averageValidDuration',
    title: '平均会话时长',
    render: flow(
      push('conversation.validDuration'),
      push('conversation.validCount'),
      divide(),
      timeDuration(),
    ),
  },
  {
    key: 'averageMessageCount',
    title: '平均消息条数',
    render: flow(
      push('conversation.messageCount'),
      push('conversation.totalCount'),
      divide(),
      fixed(2),
    ),
  },
  {
    key: 'onlineTime',
    title: '登录时长',
    render: flow(push('online.totalTime'), pushValue(1000 * 60), multiply(), timeDuration()),
  },
  {
    key: 'readyTime',
    title: '在线时长',
    render: flow(push('online.readyTime'), pushValue(1000 * 60), multiply(), timeDuration()),
  },
  {
    key: 'busyTime',
    title: '忙碌时长',
    render: flow(push('online.busyTime'), pushValue(1000 * 60), multiply(), timeDuration()),
  },
  {
    key: 'postprocessingDuration',
    title: '后处理总时长',
    render: flow(push('postprocessing.duration'), timeDuration()),
  },
  {
    key: 'postprocessingCount',
    title: '后处理次数',
    render: flow(push('postprocessing.count')),
  },
  {
    key: 'leaveTime',
    title: '离开时长',
    render: flow(push('online.leaveTime'), pushValue(1000 * 60), multiply(), timeDuration()),
  },
  {
    key: 'averageValidReceptionTime',
    title: '平均人工接待时长',
    render: flow(
      push('conversation.validReceptionTime'),
      push('conversation.validCount'),
      divide(),
      timeDuration(),
    ),
  },
  {
    key: 'totalEvaluationCount',
    title: '评价总数',
    render: flow(push('conversation.validEvaluationCount')),
  },
  {
    key: 'noEvaluationCount',
    title: '未评价总数',
    render: flow(
      push('conversation.validCount'),
      push('conversation.validEvaluationCount'),
      subtract(),
    ),
  },
  {
    key: 'evaluationPercentage',
    title: '参评率',
    render: flow(
      push('conversation.validEvaluationCount'),
      push('conversation.validCount'),
      divide(),
      percent(),
    ),
  },
  {
    dataIndex: ['conversation', 'validEvaluationInvitationCount'],
    title: '客服邀请量',
  },
  {
    key: 'evaluationInvitationPercentage',
    title: '客服邀请率',
    render: flow(
      push('conversation.validEvaluationInvitationCount'),
      push('conversation.validCount'),
      divide(),
      percent(),
    ),
  },
  {
    key: 'negativeRate',
    title: '差评率',
    render: flow(
      push('conversation.evaluationStar1'),
      push('conversation.evaluationStar2'),
      add(),
      push('conversation.validEvaluationCount'),
      divide(),
      percent(),
    ),
  },
  {
    dataIndex: ['conversation', 'evaluationStar5'],
    title: '非常满意量',
  },
  {
    dataIndex: ['conversation', 'evaluationStar4'],
    title: '满意量',
  },
  {
    dataIndex: ['conversation', 'evaluationStar3'],
    title: '一般量',
  },
  {
    dataIndex: ['conversation', 'evaluationStar2'],
    title: '不满意量',
  },
  {
    dataIndex: ['conversation', 'evaluationStar1'],
    title: '非常不满意量',
  },
];

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

  return (
    <OperatorNameProvider>
      <BasicFilterForm initData={formData} onChange={setFormData} />

      <Table
        style={{ marginTop: 20 }}
        dataSource={data}
        rowKey={(row) => row.id}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        columns={columns}
      />
    </OperatorNameProvider>
  );
}
