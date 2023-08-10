import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import cx from 'classnames';

import { Conversation } from '@/App/Panel/types';
import { diffTime } from './utils';

interface ConversationListProps {
  conversations?: Conversation[];
  onClick: (conv: Conversation) => void;
  activeConversation?: string;
}

export function ConversationList({
  conversations,
  onClick,
  activeConversation,
}: ConversationListProps) {
  const now = Date.now();

  return conversations?.map((conv) => (
    <div
      key={conv.id}
      className={cx('h-[60px] px-5 py-4 border-b hover:bg-[#eff2f6] cursor-pointer box-content', {
        'bg-[#eff2f6]': conv.id === activeConversation,
      })}
      onClick={() => onClick(conv)}
    >
      <div className="flex items-center">
        <Avatar className="shrink-0">{conv.id.slice(0, 1)}</Avatar>
        <div className="ml-[10px] grow overflow-hidden">
          <div className="flex items-center">
            <div className="text-sm font-medium truncate">{conv.id}</div>
            {conv.lastMessage && (
              <div className="text-xs ml-auto shrink-0">
                {diffTime(now, conv.lastMessage.createdAt)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#647491]">Live chat</div>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <div className="text-sm mr-auto">{conv.lastMessage?.data.content}</div>
        {conv.operatorId && <Avatar size={18} icon={<UserOutlined />} />}
      </div>
    </div>
  ));
}
