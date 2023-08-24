import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

export const DoCloseConversation = withNode('action', ({ data }) => {
  return (
    <div className="p-2 relative">
      关闭对话
      <NodeHandle type="target" id={`${data.id}.in`} />
      <NodeHandle type="source" id={`${data.id}.out`} />
    </div>
  );
});
