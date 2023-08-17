import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  DefaultEdgeOptions,
  Edge,
  EdgeTypes,
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
import { nanoid } from 'nanoid';

import { ChatBotNode } from '@/App/Panel/types';
import './flow.css';
import { NodePanel } from './NodePanel';
import { EventNode } from './EventNode';
import { ActionNode } from './ActionNode';
import { NodeEdge } from './NodeEdge';

const nodeTypes: NodeTypes = {
  event: EventNode,
  action: ActionNode,
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

function getFlowNodeType(chatBotNodeType: string) {
  if (chatBotNodeType.startsWith('on')) {
    return 'event';
  }
  if (chatBotNodeType.startsWith('is')) {
    return 'condition';
  }
  if (chatBotNodeType.startsWith('do')) {
    return 'action';
  }
  return 'unknown';
}

function hasOrphanNode(nodes: Node[], edges: Edge[]) {
  return nodes.some((node) => {
    const inNodes = getIncomers(node, nodes, edges);
    const outNodes = getOutgoers(node, nodes, edges);
    return inNodes.length === 0 && outNodes.length === 0;
  });
}

interface ChatBotCreatorProps {
  initialName?: string;
  initialNodes?: ChatBotNode[];
  onSave: (name: string, nodes: ChatBotNode[]) => void;
  onBack?: () => void;
  loading?: boolean;
}

function ChatBotCreatorInner({
  initialName,
  initialNodes,
  onSave,
  onBack,
  loading,
}: ChatBotCreatorProps) {
  const initialFlowNodes = useMemo<Node[]>(() => {
    if (!initialNodes) {
      return [];
    }
    return initialNodes.map((node) => {
      return {
        id: node.id,
        type: getFlowNodeType(node.type),
        data: node,
        position: node.position || { x: 0, y: 0 },
        dragHandle: '.dragHandle',
      };
    });
  }, [initialNodes]);

  const initialFlowEdges = useMemo<Edge[]>(() => {
    if (!initialNodes) {
      return [];
    }
    return initialNodes.flatMap((node) => {
      return node.next.map((next) => {
        return {
          id: `${node.id}-${next}`,
          source: node.id,
          target: next,
        };
      });
    });
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  const onConnect = useCallback<OnConnect>(
    (conn) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges],
  );

  const viewport = useViewport();

  const handleAddNode = (type: string, botNode: Partial<ChatBotNode>) => {
    const id = nanoid(16);
    const node: Node = {
      id,
      type,
      position: { x: -viewport.x, y: -viewport.y },
      dragHandle: '.dragHandle',
      data: {
        id,
        ...botNode,
      },
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

  const [name, setName] = useState(initialName || '');
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
      return Modal.info({
        title: '提示',
        content: error,
      });
    }

    const botNodes: ChatBotNode[] = nodes.map((node) => {
      return {
        ...node.data,
        id: node.id,
        position: {
          x: node.position.x,
          y: node.position.y,
        },
        next: getOutgoers(node, nodes, edges).map((node) => node.id),
      };
    });

    onSave(name, botNodes);
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
