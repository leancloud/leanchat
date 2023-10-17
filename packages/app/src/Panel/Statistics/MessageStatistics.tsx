import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
  ConversationMessageStatistics as StatsData,
  getConversationMessageStatistics,
} from '../api/statistics';
import { LoadingCover } from '../components/LoadingCover';
import { StatsGroup } from './components/StatsGroup';
import { StatsCard } from './components/StatsCard';
import { BasicFilterForm, BasicFilterFormData } from './components/BasicFilterForm';

interface StatsListProps {
  data: StatsData;
}

function StatsList({ data }: StatsListProps) {
  const { operatorMessageCount = 0, visitorMessageCount = 0 } = data;

  return (
    <>
      <StatsGroup title="会话消息概览">
        <StatsCard title="总会话消息数" value={operatorMessageCount + visitorMessageCount} />
        <StatsCard title="用户消息数" value={visitorMessageCount} />
        <StatsCard title="客服消息数" value={operatorMessageCount} />
      </StatsGroup>
    </>
  );
}

export function ConversationMessageStatistics() {
  const [formData, setFormData] = useState<BasicFilterFormData>({
    dateRange: [dayjs(), dayjs()],
  });

  const filters = useMemo(() => {
    const {
      dateRange: [from, to],
      channel,
      operatorId,
    } = formData;
    return {
      from: from.startOf('day').startOf('day').toDate(),
      to: to.endOf('day').endOf('day').toDate(),
      channel,
      operatorId,
    };
  }, [formData]);

  const { data, isFetching } = useQuery({
    queryKey: ['ConversationMessageStatistics', filters],
    queryFn: () => getConversationMessageStatistics(filters),
  });

  return (
    <>
      <BasicFilterForm initData={formData} onChange={setFormData} />
      <div className="mt-6 relative">
        {isFetching && <LoadingCover minHeight={400} />}
        {data && <StatsList data={data} />}
      </div>
    </>
  );
}
