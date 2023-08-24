import { JSXElementConstructor, ReactNode, createContext, useContext } from 'react';
import { MdClose } from 'react-icons/md';
import cx from 'classnames';
import { NodeProps, useReactFlow } from 'reactflow';
import { produce } from 'immer';

interface NodeContainerProps {
  type: 'event' | 'condition' | 'action';
  onRemove?: () => void;
  children?: ReactNode;
}

export function NodeContainer({ type, onRemove, children }: NodeContainerProps) {
  return (
    <div className="rounded bg-white shadow-md text-sm min-w-[200px]">
      <div
        className={cx('dragHandle flex items-center text-white font-medium px-2 py-1 rounded-t', {
          'bg-[#00a9ff]': type === 'event',
          'bg-[#303f9f]': type === 'action',
        })}
      >
        <div className="mr-auto">
          {type === 'event' && '事件'}
          {type === 'condition' && '条件'}
          {type === 'action' && '操作'}
        </div>
        <button onClick={onRemove}>
          <MdClose className="w-[12px] h-[12px]" />
        </button>
      </div>
      <div className="cursor-default">{children}</div>
    </div>
  );
}

const NodeContext = createContext<NodeProps | undefined>(undefined);

export function useNode() {
  return useContext(NodeContext)!;
}

interface CustomNodeProps {
  data: any;
  setData: (updater: (data: any) => void) => void;
}

export function withNode(
  type: 'event' | 'condition' | 'action',
  Component: JSXElementConstructor<CustomNodeProps>,
): JSXElementConstructor<NodeProps> {
  return (props) => {
    const { id, data } = props;
    const { setNodes } = useReactFlow();

    const handleRemove = () => {
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
    };

    const setData = (updater: (data: any) => void) => {
      setNodes(
        produce((nodes) => {
          for (const node of nodes) {
            if (node.id === id) {
              updater(node.data);
              break;
            }
          }
        }),
      );
    };

    return (
      <NodeContext.Provider value={props}>
        <NodeContainer type={type} onRemove={handleRemove}>
          <Component data={data} setData={setData} />
        </NodeContainer>
      </NodeContext.Provider>
    );
  };
}
