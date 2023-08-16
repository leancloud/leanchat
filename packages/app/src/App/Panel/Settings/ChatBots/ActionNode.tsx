import { Handle, NodeProps, Position, useReactFlow } from 'reactflow';
import { MdClose } from 'react-icons/md';

import { Action } from './Actions';

export function ActionNode({ id, data }: NodeProps) {
  const flow = useReactFlow();

  const handleRemove = () => {
    flow.setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 20,
          height: 4,
          border: 'none',
          borderRadius: '0 0 2px 2px',
          bottom: -5,
          backgroundColor: '#647491',
        }}
      />
      <div className="w-[200px] rounded overflow-hidden shadow-md">
        <div className="bg-white">
          <div className="dragHandle flex items-center bg-red-500 text-xs text-white px-2 py-1 font-medium">
            <div className="mr-auto">操作</div>
            <button onClick={handleRemove}>
              <MdClose className="w-[12px] h-[12px]" />
            </button>
          </div>
          <div className="p-2 text-sm cursor-default">
            <Action data={data} />
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
