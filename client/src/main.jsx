import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically attach logged-in player x-user-id header to all /api requests
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  if (typeof url === 'string' && url.startsWith('/api')) {
    try {
      const stored = localStorage.getItem('xbet_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.id) {
          options.headers = {
            ...options.headers,
            'x-user-id': u.id
          };
        }
      }
    } catch (e) {}
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
