import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

export const OnConversationCreated = withNode('event', () => {
  return (
    <div className="p-2 relative">
      创建对话
      <NodeHandle id="defaultSource" type="source" />
    </div>
  );
});
