import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useReactFlow } from 'reactflow';
import { MdClose } from 'react-icons/md';

export function NodeEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const flow = useReactFlow();

  const handleRemove = () => {
    flow.setEdges((eds) => eds.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="absolute"
          style={{
            pointerEvents: 'all',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button className="bg-white rounded-full p-1 shadow" onClick={handleRemove}>
            <MdClose />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
