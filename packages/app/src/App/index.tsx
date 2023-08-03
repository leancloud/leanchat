import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Panel = lazy(() => import('./Panel'));
const Chat = lazy(() => import('./Chat'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense>
        <Routes>
          <Route path="panel/*" element={<Panel />} />
          <Route path="chat" element={<Chat />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
