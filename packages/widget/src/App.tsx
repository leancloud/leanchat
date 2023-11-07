import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppContext, AppContextValue } from './AppContext';
import { Chat } from './chat';
import Modern from './Modern';

function App(ctx: AppContextValue) {
  return (
    <StrictMode>
      <AppContext.Provider value={ctx}>
        <Chat>
          <Modern />
        </Chat>
      </AppContext.Provider>
    </StrictMode>
  );
}

export function render(element: HTMLElement, ctx: AppContextValue) {
  const root = createRoot(element);
  root.render(<App {...ctx} />);
  return root;
}
