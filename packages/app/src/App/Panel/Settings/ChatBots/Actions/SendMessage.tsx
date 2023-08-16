import { useReactFlow } from 'reactflow';
import { Input } from 'antd';
import { produce } from 'immer';
import { useState } from 'react';
import { useDebounce } from 'react-use';

import { ChatBotNode } from '@/App/Panel/types';

interface SendMessageProps {
  data: ChatBotNode & {
    message: {
      content: string;
    };
  };
}

export function SendMessage({ data }: SendMessageProps) {
  const [content, setContent] = useState(data.message.content);

  const flow = useReactFlow();

  const handleChange = (content: string) => {
    flow.setNodes((nodes) => {
      return produce(nodes, (nodes) => {
        for (const node of nodes) {
          if (node.id === data.id) {
            node.data.message.content = content;
            break;
          }
        }
      });
    });
  };

  useDebounce(() => handleChange(content), 200, [content]);

  return (
    <div>
      <div className="mb-2">发送消息</div>
      <Input.TextArea
        autoSize
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ padding: 4 }}
      />
    </div>
  );
}
