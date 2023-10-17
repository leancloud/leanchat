import { Tabs } from 'antd';

import { ConversationStatistics } from './ConversationStatistics';
import { ConversationMessageStatistics } from './MessageStatistics';
import { ConversationRecord } from './ConversationRecord';
import { OperatorStats } from './OperatorStats';
import { EvaluationStats } from './EvaluationStats';

export default function Statistics() {
  return (
    <div className="p-10 pt-6 bg-white h-full overflow-auto">
      <Tabs
        defaultActiveKey="conversation"
        items={[
          {
            key: 'conversation',
            label: '会话统计',
            children: <ConversationStatistics />,
          },
          {
            key: 'message',
            label: '消息统计',
            children: <ConversationMessageStatistics />,
          },
          {
            key: 'conversationRecord',
            label: '会话记录',
            children: <ConversationRecord />,
          },
          {
            key: 'operator',
            label: '客服工作量统计',
            children: <OperatorStats />,
          },
          {
            key: 'evaluation',
            label: '满意度评价统计',
            children: <EvaluationStats />,
          },
        ]}
      />
    </div>
  );
}
