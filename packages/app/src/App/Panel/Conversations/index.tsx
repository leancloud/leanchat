import { useMemo, useState } from 'react';
import _ from 'lodash';

import { CustomSider } from '../Layout';
import { Sider } from './Sider';
import {
  ConversationsQueryVariables,
  useConversations,
  useSetConversationQueryData,
} from '@/App/Panel/hooks/conversation';
import { useCurrentUser } from '@/App/Panel/auth';
import { Conversation } from './Conversation';
import { useToggle } from 'react-use';

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

  const [showDetail, toggleDetail] = useToggle(false);

  return (
    <>
      <CustomSider>
        <Sider
          stream={stream}
          onChangeStream={setStream}
          conversations={conversations}
          loading={isLoading}
          onClickConversation={(conv) => {
            setConversationId(conv.id);
            setConvQueryData(conv);
          }}
          activeConversation={conversationId}
        />
      </CustomSider>

      {conversationId && (
        <Conversation
          key={conversationId}
          conversationId={conversationId}
          showDetail={showDetail}
          onToggleDetail={toggleDetail}
        />
      )}
    </>
  );
}
