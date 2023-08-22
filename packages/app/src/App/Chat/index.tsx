import { useLocalStorage } from 'react-use';
import { nanoid } from 'nanoid';

import { SocketProvider } from '@/socket';
import { Classic } from './Classic';

const VISITOR_ID = nanoid();

export default function Chat() {
  const [visitorId] = useLocalStorage('LeanChat/visitorId', VISITOR_ID);

  return (
    <SocketProvider auth={{ id: visitorId }}>
      <div
        style={{
          display: 'block',
          border: 'none',
          position: 'fixed',
          inset: 'auto 0px 0px auto',
          opacity: 1,
          colorScheme: 'none',
          background: 'none transparent !important',
          margin: 0,
          maxHeight: '100%',
          maxWidth: '100vw',
          zIndex: '999999999 !important',
        }}
      >
        <Classic />
      </div>
    </SocketProvider>
  );
}
