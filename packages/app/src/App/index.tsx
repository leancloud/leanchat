import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Panel = lazy(() => import('./Panel'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback="加载中...">
        <Routes>
          <Route path="panel/*" element={<Panel />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
