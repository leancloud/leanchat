import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

import { Conversation } from '@/App/Panel/types';
import { diffTime } from './utils';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations?: Conversation[];
  onClick: (conv: Conversation) => void;
  activeConversation?: string;
  unreadAlert?: boolean;
}

export function ConversationList({
  conversations,
  onClick,
  activeConversation,
  unreadAlert,
}: ConversationListProps) {
  const now = Date.now();

  return conversations?.map((conv) => {
    const avatarColor = '#' + conv.visitorId.slice(-6);

    return (
      <button key={conv.id} onClick={() => onClick(conv)}>
        <ConversationItem
          active={conv.id === activeConversation}
          avatar={
            <Avatar className="shrink-0" style={{ backgroundColor: avatarColor }}>
              {conv.id.slice(0, 1)}
            </Avatar>
          }
          title={conv.id}
          time={conv.lastMessage && diffTime(now, conv.lastMessage!.createdAt)}
          message={conv.lastMessage?.data.content}
          operatorAvatar={
            conv.operatorId && <Avatar className="shrink-0" size={18} icon={<UserOutlined />} />
          }
          unread={unreadAlert && conv.lastMessage?.from === conv.visitorId}
        />
      </button>
    );
  });
}
