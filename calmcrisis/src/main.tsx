import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker (safe in HTTPS / Vercel)
if ('serviceWorker' in navigator) {
  const secure = (window as any).isSecureContext === true || location.hostname === 'localhost';
  const notIframe = (() => { try { return window.top === window.self; } catch { return false; } })();
  if (secure && notIframe) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // тихо игнорирай (някои среди блокират SW)
      });
    });
  }
}
