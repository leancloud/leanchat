import { Tabs } from 'antd';

import { ConversationStatistics } from './ConversationStatistics';
import { ConversationMessageStatistics } from './MessageStatistics';

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
        ]}
      />
    </div>
  );
}
