import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import { Classic } from './Classic';
import { Chat } from './chat';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Chat>
      <div
        className="flex flex-col h-screen sm:h-[520px] sm:block sm:fixed sm:inset-[auto_4px_4px_auto]"
        style={
          {
            // display: 'block',
            // border: 'none',
            // position: 'fixed',
            // inset: 'auto 0px 0px auto',
            // opacity: 1,
            // colorScheme: 'none',
            // background: 'none transparent !important',
            // margin: 0,
            // maxHeight: '100vh',
            // maxWidth: '100vw',
            // zIndex: '999999999 !important',
          }
        }
      >
        <Classic />
      </div>
    </Chat>
  </React.StrictMode>,
);
