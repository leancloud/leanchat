import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

export const OnConversationCreated = withNode('event', ({ data }) => {
  return (
    <div className="p-2 relative">
      创建对话
      <NodeHandle type="source" id={`${data.id}.out`} />
    </div>
  );
});
