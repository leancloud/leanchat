import { JSXElementConstructor, memo } from 'react';

import { ChatBotNode } from '@/App/Panel/types';
import { CreateConversation } from './ConversationCreated';
import { VisitorInactive } from './VisitorInactive';

const triggerComponents: Record<string, JSXElementConstructor<any>> = {
  onConversationCreated: CreateConversation,
  onVisitorInactive: VisitorInactive,
};

interface EventProps {
  data: ChatBotNode;
}

export const Event = memo(({ data }: EventProps) => {
  const Component = triggerComponents[data.type];
  if (Component) {
    return <Component {...data} />;
  } else {
    return 'Unknown';
  }
});
