import { useEffect, useMemo } from 'react';
import { Handle, HandleProps, Position, useEdges, useReactFlow } from 'reactflow';

import { useEffectEvent } from '@/Panel/hooks/useEffectEvent';
import { useNode } from './Container';

interface NodeHandleProps extends Omit<HandleProps, 'position'> {
  id: string;
}

export function NodeHandle(props: NodeHandleProps) {
  const { id, type } = props;

  const { id: nodeId } = useNode();

  const edges = useEdges();

  const isConnectable = useMemo(() => {
    if (type === 'source') {
      return !edges.some((edge) => edge.source === nodeId && edge.sourceHandle === id);
    } else {
      return !edges.some((edge) => edge.target === nodeId && edge.targetHandle === id);
    }
  }, [nodeId, edges]);

  const { setEdges } = useReactFlow();

  const removeConnectedEdges = useEffectEvent(() => {
    if (type === 'source') {
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== nodeId || edge.sourceHandle !== id),
      );
    } else {
      setEdges((edges) =>
        edges.filter((edge) => edge.target !== nodeId || edge.targetHandle !== id),
      );
    }
  });

  useEffect(() => removeConnectedEdges, []);

  return (
    <Handle
      {...props}
      id={id}
      position={type === 'source' ? Position.Right : Position.Left}
      isConnectable={isConnectable}
      style={{
        width: 8,
        height: 8,
        border: 'none',
        borderRadius: 1,
        backgroundColor: '#647491',
      }}
    />
  );
}
