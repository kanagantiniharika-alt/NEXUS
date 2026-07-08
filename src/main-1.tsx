import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// import { registerMockFetch } from './mockApi.ts';

// Register standard sandbox fetch proxy for high fidelity offline/iframe compatibility
// registerMockFetch();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
