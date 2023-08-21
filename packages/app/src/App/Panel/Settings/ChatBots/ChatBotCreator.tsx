import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  DefaultEdgeOptions,
  Edge,
  EdgeTypes,
  MiniMap,
  Node,
  NodeTypes,
  OnConnect,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  getIncomers,
  getOutgoers,
  useEdgesState,
  useNodesState,
  useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import _ from 'lodash';
import { Button, Input, Modal } from 'antd';
import { useToggle } from 'react-use';

import { ChatBotEdge, ChatBotNode } from '@/App/Panel/types';
import './flow.css';
import { NodePanel } from './NodePanel';
import { NodeEdge } from './NodeEdge';
import { OnConversationCreated } from './Nodes/OnConversationCreated';
import { DoSendMessage } from './Nodes/DoSendMessage';

const nodeTypes: NodeTypes = {
  onConversationCreated: OnConversationCreated,
  doSendMessage: DoSendMessage,
};

const edgeTypes: EdgeTypes = {
  nodeEdge: NodeEdge,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'nodeEdge',
};

function canReachNode(from: Node, to: Node, nodes: Node[], edges: Edge[]) {
  const outs = getOutgoers(from, nodes, edges);
  for (const out of outs) {
    if (out.id === to.id) {
      return true;
    }
    if (canReachNode(out, to, nodes, edges)) {
      return true;
    }
  }
  return false;
}

function hasOrphanNode(nodes: Node[], edges: Edge[]) {
  return nodes.some((node) => {
    const inNodes = getIncomers(node, nodes, edges);
    const outNodes = getOutgoers(node, nodes, edges);
    return inNodes.length === 0 && outNodes.length === 0;
  });
}

interface ChatBotCreatorData {
  name: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
}

interface ChatBotCreatorProps {
  initialData?: ChatBotCreatorData;
  onSave: (data: ChatBotCreatorData) => void;
  onBack?: () => void;
  loading?: boolean;
}

function ChatBotCreatorInner({ initialData, onSave, onBack, loading }: ChatBotCreatorProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    initialData?.nodes.forEach((node) => {
      initialNodes.push({
        id: node.id,
        type: node.type,
        data: node,
        position: node.position || { x: 0, y: 0 },
        dragHandle: '.dragHandle',
      });
    });

    initialData?.edges.forEach((edge) => {
      initialEdges.push({
        id: `${edge.sourceNode}-${edge.targetNode}`,
        source: edge.sourceNode,
        sourceHandle: edge.sourcePin,
        target: edge.targetNode,
        targetHandle: edge.targetPin,
      });
    });

    return { initialNodes, initialEdges };
  }, [initialData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback<OnConnect>(
    (conn) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges],
  );

  const viewport = useViewport();

  const handleAddNode = (botNode: ChatBotNode) => {
    const node: Node = {
      id: botNode.id,
      type: botNode.type,
      position: { x: -viewport.x, y: -viewport.y },
      dragHandle: '.dragHandle',
      data: botNode,
    };
    setNodes((nodes) => [...nodes, node]);
  };

  const isValidConnection = (conn: Connection) => {
    if (!conn.source || !conn.target) {
      return false;
    }
    if (conn.source === conn.target) {
      return false;
    }
    const sourceNode = nodes.find((node) => node.id === conn.source)!;
    const targetNode = nodes.find((node) => node.id === conn.target)!;
    return !canReachNode(targetNode, sourceNode, nodes, edges);
  };

  const [name, setName] = useState(initialData?.name || '');
  const [showPanel, togglePanel] = useToggle(true);

  const handleCreate = () => {
    let error: string | undefined;
    if (!name) {
      error = '请填写机器人名称';
    } else if (nodes.length === 0) {
      error = '请添加至少一个节点';
    } else if (hasOrphanNode(nodes, edges)) {
      error = '请移除所有孤儿节点';
    }

    if (error) {
      return Modal.info({ title: '提示', content: error });
    }

    const botNodes: ChatBotNode[] = nodes.map((node) => {
      return {
        ...node.data,
        id: node.id,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        },
      };
    });

    const botEdges: ChatBotEdge[] = edges.map((edge) => ({
      sourceNode: edge.source!,
      sourcePin: edge.sourceHandle!,
      targetNode: edge.target!,
      targetPin: edge.targetHandle!,
    }));

    onSave({
      name,
      nodes: botNodes,
      edges: botEdges,
    });
  };

  return (
    <>
      <ReactFlow
        panOnScroll
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Controls />
        <Background variant={BackgroundVariant.Cross} />
        <Panel position="top-left">
          <Input
            size="large"
            placeholder="机器人名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 300 }}
          />
        </Panel>
        <Panel position="top-right">
          <div className="space-x-4">
            <Button size="large" onClick={onBack}>
              返回
            </Button>
            <Button size="large" type="primary" onClick={handleCreate} loading={loading}>
              保存
            </Button>
          </div>
        </Panel>
        <Panel position="top-right" style={{ top: 60, bottom: showPanel ? 0 : undefined }}>
          <NodePanel show={showPanel} onToggle={togglePanel} onAddNode={handleAddNode} />
        </Panel>
        <MiniMap pannable />
      </ReactFlow>
    </>
  );
}

export function ChatBotCreator(props: ChatBotCreatorProps) {
  return (
    <ReactFlowProvider>
      <ChatBotCreatorInner {...props} />
    </ReactFlowProvider>
  );
}
