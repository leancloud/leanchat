import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import dayjs from 'dayjs';

import {
  ConversationMessageStatistics as StatsData,
  getConversationMessageStatistics,
} from '../api/statistics';
import { FiltersForm, FiltersFormData } from './ConversationStatistics';
import { StatsGroup } from './components/StatsGroup';
import { StatsCard } from './components/StatsCard';

interface StatsListProps {
  data: StatsData;
}

function StatsList({ data }: StatsListProps) {
  return (
    <>
      <StatsGroup title="会话消息概览">
        <StatsCard
          title="总会话消息数"
          value={data.operatorMessageCount + data.visitorMessageCount}
        />
        <StatsCard title="用户消息数" value={data.visitorMessageCount} />
        <StatsCard title="客服消息数" value={data.operatorMessageCount} />
      </StatsGroup>
    </>
  );
}

export function ConversationMessageStatistics() {
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

  const { data } = useQuery({
    queryKey: ['ConversationMessageStatistics', filters],
    queryFn: () => getConversationMessageStatistics(filters),
  });

  return (
    <>
      <FiltersForm initData={filtersFormData} onChange={setFilters} />
      <div className="mt-6">{data ? <StatsList data={data} /> : <Spin />}</div>
    </>
  );
}
