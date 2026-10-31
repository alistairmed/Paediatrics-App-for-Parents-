
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted font (no request to Google Fonts; works offline).
import '@fontsource/quicksand/300.css';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
import './index.css';

// After a new deploy, an open tab may request screen files that no longer exist.
// Reload once to pick up the current version instead of showing a broken screen.
window.addEventListener('vite:preloadError', (event) => {
  const reloadedAt = Number(sessionStorage.getItem('chunk-reload-at') || 0);
  if (Date.now() - reloadedAt < 10000) return;
  event.preventDefault();
  sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  window.location.reload();
});

// Save the app on the device so it opens without a connection (production only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

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
