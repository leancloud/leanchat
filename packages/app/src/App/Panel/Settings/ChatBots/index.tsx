import { Button } from 'antd';
import { Link } from 'react-router-dom';

export { NewChatBot } from './NewBot';

export function ChatBots() {
  return (
    <div>
      <div className="flex">
        <div className="ml-auto">
          <Link to="new">
            <Button type="primary">添加</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
