import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { MdClose } from 'react-icons/md';

import { Event } from './Events';

export function EventNode({ id, data }: NodeProps) {
  const flow = useReactFlow();

  const handleRemove = () => {
    flow.setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <>
      <div className="w-[200px] rounded overflow-hidden shadow-md">
        <div className="bg-white">
          <div className="dragHandle flex items-center bg-[#00a9ff] text-xs text-white px-2 py-1 font-medium">
            <div className="mr-auto">事件</div>
            <button onClick={handleRemove}>
              <MdClose className="w-[12px] h-[12px]" />
            </button>
          </div>
          <div className="p-2 text-sm cursor-default">
            <Event data={data} />
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 20,
          height: 4,
          border: 'none',
          borderRadius: '0 0 2px 2px',
          bottom: -5,
          backgroundColor: '#647491',
        }}
      />
    </>
  );
}
