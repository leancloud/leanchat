import { ReactNode, useMemo, useState } from 'react';
import { MdMenuOpen } from 'react-icons/md';
import { Empty, Spin } from 'antd';
import _ from 'lodash';

import { Sider } from './Sider';
import {
  ConversationsQueryVariables,
  useConversations,
  useSetConversationQueryData,
} from '@/Panel/hooks/conversation';
import { useCurrentUser } from '@/Panel/auth';
import { Conversation } from './Conversation';
import { ConversationList } from './ConversationList';

const LIVE_CONVERSATION_LABELS: Record<string, ReactNode> = {
  unassigned: (
    <>
      <span>未分配</span>
    </>
  ),
  myOpen: (
    <>
      <span>我的</span>
    </>
  ),
  solved: (
    <>
      <span>已解决</span>
    </>
  ),
  allOperators: <span>全部</span>,
};

export default function Conversations() {
  const user = useCurrentUser();
  const [stream, setStream] = useState('myOpen');

  const convQueryVars = useMemo<ConversationsQueryVariables>(() => {
    if (stream === 'unassigned') {
      return { type: 'unassigned' };
    } else if (stream === 'myOpen') {
      return { type: 'operator', operatorId: user!.id };
    } else if (stream === 'solved') {
      return { type: 'solved' };
    } else if (stream === 'allOperators') {
      return { type: 'allOperators' };
    } else if (stream.startsWith('operator/')) {
      return {
        type: 'operator',
        operatorId: stream.slice('operator/'.length),
      };
    }
    throw 'unreachable';
  }, [stream, user]);

  const [conversationId, setConversationId] = useState<string>();

  const { data: conversations, isLoading } = useConversations(convQueryVars);

  const setConvQueryData = useSetConversationQueryData();

  return (
    <div className="h-full flex">
      <Sider stream={stream} onChangeStream={setStream} />

      <div className="w-[300px] border-x flex flex-col bg-white rounded-l-2xl shrink-0">
        <div className="px-5 border-b border-[#ededed]">
          <div className="h-[70px] font-medium text-[20px] flex items-center">
            <button className="mr-4 text-[#969696] p-1 rounded hover:bg-gray-100">
              <MdMenuOpen className="w-[22px] h-[22px]" />
            </button>
            {LIVE_CONVERSATION_LABELS[stream]}
          </div>
        </div>
        <div className="overflow-y-auto grow flex flex-col">
          {isLoading && (
            <div className="h-full flex justify-center items-center">
              <Spin />
            </div>
          )}
          {conversations?.length === 0 && (
            <div className="py-20">
              <Empty description="暂无会话" />
            </div>
          )}
          <ConversationList
            conversations={conversations}
            onClick={(conv) => {
              setConversationId(conv.id);
              setConvQueryData(conv);
            }}
            activeConversation={conversationId}
            unreadAlert={stream === 'myOpen'}
          />
        </div>
      </div>

      <div className="grow bg-white">
        {conversationId && <Conversation key={conversationId} conversationId={conversationId} />}
      </div>
    </div>
  );
}
