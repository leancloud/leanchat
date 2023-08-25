import { Avatar } from 'antd';

import { Conversation } from '@/Panel/types';
import { ConversationItem } from './ConversationItem';
import { NowProvider } from '../contexts/NowContext';

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
  const list = conversations?.map((conv) => {
    const avatarColor = '#' + conv.visitorId.slice(-6);

    return (
      <button key={conv.id} onClick={() => onClick(conv)}>
        <ConversationItem
          conversation={conv}
          active={conv.id === activeConversation}
          avatar={
            <Avatar className="shrink-0" style={{ backgroundColor: avatarColor }}>
              {conv.id.slice(0, 1)}
            </Avatar>
          }
          title={conv.id}
          message={conv.lastMessage?.data.content}
          unreadAlert={unreadAlert}
        />
      </button>
    );
  });

  if (unreadAlert) {
    return <NowProvider interval={1000}>{list}</NowProvider>;
  }

  return list;
}
