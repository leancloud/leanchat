import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';

import { OperatorSelect } from '../components/OperatorSelect';
import {
  ConversationStatistics as ConversationStatisticsSchema,
  getConversationStatistics,
} from '../api/statistics';
import { LoadingCover } from '../components/LoadingCover';
import { StatsCard } from './components/StatsCard';
import { StatsGroup } from './components/StatsGroup';
import { ChannelSelect } from './components/ChannelSelect';

export interface FiltersFormData {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  channel?: string;
  operatorId?: string[];
}

interface FiltersFormProps {
  initData?: Partial<FiltersFormData>;
  onChange: (data: FiltersFormData) => void;
}

export function FiltersForm({ initData, onChange }: FiltersFormProps) {
  return (
    <Form layout="inline" initialValues={initData} onFinish={onChange}>
      <Form.Item name="dateRange" rules={[{ required: true }]}>
        <DatePicker.RangePicker />
      </Form.Item>
      <Form.Item name="channel">
        <ChannelSelect allowClear />
      </Form.Item>
      <Form.Item name="operatorId">
        <OperatorSelect mode="multiple" placeholder="人工客服" style={{ minWidth: 120 }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          查询
        </Button>
        <Button className="ml-2" htmlType="reset">
          重置
        </Button>
      </Form.Item>
    </Form>
  );
}

const avg = (count: number, sum: number) => {
  if (count === 0) {
    return 'N/A';
  }
  const sec = Math.floor(sum / count / 1000);
  if (sec > 60) {
    const min = Math.floor(sec / 60);
    return `${min}分${sec % 60}秒`;
  }
  return `${sec}秒`;
};

const percentage = (part: number, whole: number) => {
  if (whole === 0) {
    return 'N/A';
  }
  return `${((part / whole) * 100).toFixed(2)}%`;
};

interface StatsListProps {
  data: ConversationStatisticsSchema;
}

function StatsList({ data }: StatsListProps) {
  const {
    incoming = 0,
    queued = 0,
    queuedAndConnected = 0,
    queuedAndLeft = 0,
    operatorCommunicated = 0,
    operatorIndependentCommunicated = 0,
    valid = 0,
    invalid = 0,
    operatorNoResponse = 0,
    receptionTime = 0,
    receptionCount = 0,
    firstResponseTime = 0,
    firstResponseCount = 0,
    responseTime = 0,
    responseCount = 0,
    overtime = 0,
    queueConnectionTime = 0,
    queueTimeToLeave = 0,
  } = data;
  const notQueued = incoming - queued;

  return (
    <>
      <StatsGroup title="用户会话概览">
        <StatsCard title="总进线量" value={incoming} />
        <StatsCard title="排队会话总数" value={queued} />
        <StatsCard title="接起量" value={notQueued + queuedAndConnected} />
        <StatsCard
          title="人工接通率"
          value={percentage(notQueued + queuedAndConnected, incoming)}
        />
      </StatsGroup>

      <StatsGroup title="人工会话">
        <StatsCard title="人工接待用户数" value={operatorCommunicated} />
        <StatsCard title="人工咨询总量" value={valid + invalid + operatorNoResponse} />
        <StatsCard title="人工独立接待会话数" value={operatorIndependentCommunicated} />
        <StatsCard title="人工有效会话" value={valid} />
        <StatsCard title="人工无效会话" value={invalid} />
        <StatsCard title="客服无应答会话" value={operatorNoResponse} />
        <StatsCard title="平均人工接待时长" value={avg(receptionCount, receptionTime)} />
        <StatsCard title="平均首次响应时长" value={avg(firstResponseCount, firstResponseTime)} />
        <StatsCard title="平均响应时长" value={avg(responseCount, responseTime)} />
        <StatsCard
          title="客服首次回复及时率"
          value={percentage(valid + operatorNoResponse - overtime, valid + operatorNoResponse)}
        />
        <StatsCard title="客服首次回复超时数量" value={overtime} />
      </StatsGroup>

      <StatsGroup title="排队会话">
        <StatsCard title="未排队会话" value={notQueued} />
        <StatsCard title="排队接通会话" value={queuedAndConnected} />
        <StatsCard title="排队离开会话" value={queuedAndLeft} />
        <StatsCard title="平均排队接通时长" value={avg(queuedAndConnected, queueConnectionTime)} />
        <StatsCard title="平均排队离开时长" value={avg(queuedAndLeft, queueTimeToLeave)} />
      </StatsGroup>
    </>
  );
}

export function ConversationStatistics() {
  const [filtersFormData, setFilters] = useState<FiltersFormData>({
    dateRange: [dayjs(), dayjs()],
  });

  const filters = useMemo(() => {
    const {
      dateRange: [from, to],
      channel,
      operatorId,
    } = filtersFormData;
    return {
      from: from.startOf('day').toDate(),
      to: to.endOf('day').toDate(),
      channel,
      operatorId,
    };
  }, [filtersFormData]);

  const { data, isFetching } = useQuery({
    queryKey: ['ConversationStatistics', filters],
    queryFn: () => getConversationStatistics(filters),
    keepPreviousData: true,
  });

  return (
    <>
      <FiltersForm initData={filtersFormData} onChange={setFilters} />
      <div className="mt-6">
        {isFetching && <LoadingCover minHeight={400} />}
        {data && <StatsList data={data} />}
      </div>
    </>
  );
}
