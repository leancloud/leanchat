import { useCallback } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  OnConnect,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  getOutgoers,
  useEdgesState,
  useNodesState,
  useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import _ from 'lodash';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { useToggle } from 'react-use';
import { nanoid } from 'nanoid';

import { ChatBotNode } from '@/App/Panel/types';
import './flow.css';
import { NodePanel } from './NodePanel';
import { EventNode } from './EventNode';
import { ActionNode } from './ActionNode';
import { NodeEdge } from './NodeEdge';
import { useMutation } from '@tanstack/react-query';
import { createChatBot } from '../../api/chat-bot';

const nodeTypes: NodeTypes = {
  event: EventNode,
  action: ActionNode,
};

const edgeTypes: EdgeTypes = {
  nodeEdge: NodeEdge,
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

interface BotCreatorProps {
  onCreate: (nodes: ChatBotNode[]) => void;
}

function BotCreator({ onCreate }: BotCreatorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback<OnConnect>(
    (conn) => setEdges((eds) => addEdge({ ...conn, type: 'nodeEdge' }, eds)),
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

  const [showPanel, togglePanel] = useToggle(true);

  const handleCreate = () => {
    const botNodes: ChatBotNode[] = [];
    nodes.forEach((node) => {
      botNodes.push({
        id: node.id,
        type: node.type!,
        next: getOutgoers(node, nodes, edges).map((node) => node.id),
        ...node.data,
      });
    });
    onCreate(botNodes);
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
      >
        <Controls />
        <Background variant={BackgroundVariant.Cross} />
        <Panel position="top-right">
          <div className="space-x-2">
            <Link to=".." relative="path">
              <Button>返回</Button>
            </Link>
            <Button type="primary" onClick={handleCreate}>
              保存
            </Button>
          </div>
        </Panel>
        <Panel position="top-right" style={{ top: 50, bottom: showPanel ? 0 : undefined }}>
          <NodePanel show={showPanel} onToggle={togglePanel} onAddNode={handleAddNode} />
        </Panel>
      </ReactFlow>
    </>
  );
}

export function NewChatBot() {
  const { mutate } = useMutation({
    mutationFn: createChatBot,
  });

  return (
    <ReactFlowProvider>
      <BotCreator
        onCreate={(nodes) => {
          mutate({
            name: 'test bot',
            nodes,
          });
        }}
      />
    </ReactFlowProvider>
  );
}
