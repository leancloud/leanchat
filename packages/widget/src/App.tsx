import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Classic } from './Classic';
import { Chat } from './chat';
import { AppContext, AppContextValue } from './AppContext';

function App(ctx: AppContextValue) {
  return (
    <StrictMode>
      <AppContext.Provider value={ctx}>
        <Chat>
          <Classic />
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
