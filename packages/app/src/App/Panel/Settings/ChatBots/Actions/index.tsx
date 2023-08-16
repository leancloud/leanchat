import { JSXElementConstructor, memo } from 'react';

import { ChatBotNode } from '@/App/Panel/types';
import { SendMessage } from './SendMessage';
import { CloseConversation } from './CloseConversation';

const actionComponents: Record<string, JSXElementConstructor<any>> = {
  doCloseConversation: CloseConversation,
  doSendMessage: SendMessage,
};

interface ActionProps {
  data: ChatBotNode;
}

export const Action = memo(({ data }: ActionProps) => {
  const Component = actionComponents[data.type];
  if (Component) {
    return <Component data={data} />;
  } else {
    return 'Unknown';
  }
});
