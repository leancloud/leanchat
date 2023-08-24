import { useState } from 'react';
import { useDebounce } from 'react-use';
import { Input } from 'antd';

import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

export const DoSendMessage = withNode('action', ({ data, setData }) => {
  const [content, setContent] = useState(data.message.content);

  const handleChange = (content: string) => {
    setData((data) => (data.message.content = content));
  };

  useDebounce(() => handleChange(content), 200, [content]);

  return (
    <div className="w-[300px] py-2">
      <div className="px-2 relative">
        发送消息
        <NodeHandle type="target" id={`${data.id}.in`} />
        <NodeHandle type="source" id={`${data.id}.out`} />
      </div>
      <div className="px-2 pt-2">
        <Input.TextArea
          autoSize
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: 4 }}
        />
      </div>
    </div>
  );
});
