import { useQuery } from '@tanstack/react-query';
import { Button, Table } from 'antd';
import { Link } from 'react-router-dom';

import { getChatBots } from '@/App/Panel/api/chat-bot';
export { NewChatBot, ChatBotDetail } from './NewBot';

export function ChatBots() {
  const { data: chatBots } = useQuery({
    queryKey: ['ChatBots'],
    queryFn: getChatBots,
  });

  return (
    <div>
      <div className="flex mb-5">
        <div className="ml-auto">
          <Link to="new">
            <Button type="primary">添加</Button>
          </Link>
        </div>
      </div>

      <Table
        dataSource={chatBots}
        rowKey="id"
        columns={[
          {
            key: 'name',
            title: '名称',
            render: (bot) => <Link to={bot.id}>{bot.name}</Link>,
          },
        ]}
      />
    </div>
  );
}
