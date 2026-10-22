
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// After a new deploy, an open tab may request screen files that no longer exist.
// Reload once to pick up the current version instead of showing a broken screen.
window.addEventListener('vite:preloadError', (event) => {
  const reloadedAt = Number(sessionStorage.getItem('chunk-reload-at') || 0);
  if (Date.now() - reloadedAt < 10000) return;
  event.preventDefault();
  sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
