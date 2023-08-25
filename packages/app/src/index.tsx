import React from 'react';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';

import App from './Panel';
import './index.css';

dayjs.extend(isToday);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
