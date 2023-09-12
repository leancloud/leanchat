import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Form, Select } from 'antd';
import dayjs from 'dayjs';

import { OperatorSelect } from '../components/OperatorSelect';
import {
  ConversationStatistics as ConversationStatisticsSchema,
  getConversationStatistics,
} from '../api/statistics';
import { LoadingCover } from '../components/LoadingCover';
import { StatsCard } from './components/StatsCard';
import { StatsGroup } from './components/StatsGroup';

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
        <Select
          allowClear
          placeholder="咨询渠道"
          options={[
            {
              label: '在线聊天',
              value: 'chat',
            },
          ]}
        />
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

interface StatsListProps {
  data: ConversationStatisticsSchema;
}

function StatsList({ data }: StatsListProps) {
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

  return (
    <>
      <StatsGroup title="用户会话概览">
        <StatsCard title="总进线量" value={data.incoming} />
        <StatsCard title="排队会话总数" value={data.queued} />
        <StatsCard title="接起量" value={data.notQueued + data.queuedAndProcessed} />
        <StatsCard
          title="人工接通率"
          value={percentage(data.notQueued + data.queuedAndProcessed, data.incoming)}
        />
      </StatsGroup>

      <StatsGroup title="人工会话">
        <StatsCard title="人工接待用户数" value={data.operatorCommunicated} />
        <StatsCard title="人工咨询总量" value={data.valid + data.invalid + data.noResponse} />
        <StatsCard title="人工独立接待会话数" value={data.oneOperatorCommunicated} />
        <StatsCard title="人工有效会话" value={data.valid} />
        <StatsCard title="人工无效会话" value={data.invalid} />
        <StatsCard title="客服无应答会话" value={data.noResponse} />
        <StatsCard title="平均人工接待时长" value={avg(data.receptionCount, data.receptionTime)} />
        <StatsCard
          title="平均首次响应时长"
          value={avg(data.firstResponseCount, data.firstResponseTime)}
        />
        <StatsCard title="平均响应时长" value={avg(data.responseCount, data.responseTime)} />
        <StatsCard
          title="客服首次回复及时率"
          value={percentage(
            data.valid + data.noResponse - data.overtime,
            data.valid + data.noResponse,
          )}
        />
      </StatsGroup>

      <StatsGroup title="排队会话">
        <StatsCard title="未排队会话" value={data.notQueued} />
        <StatsCard title="排队接通会话" value={data.queuedAndProcessed} />
        <StatsCard title="排队离开会话" value={data.queuedAndLeft} />
        <StatsCard
          title="平均排队接通时长"
          value={avg(data.queuedAndProcessed, data.queuedAndProcessedTime)}
        />
        <StatsCard
          title="平均排队离开时长"
          value={avg(data.queuedAndLeft, data.queuedAndLeftTime)}
        />
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
