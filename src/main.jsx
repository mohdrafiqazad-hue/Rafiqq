import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { UIProvider } from './components/ui.jsx';
import App from './App.jsx';
import './styles.css';

let updateSW = null;
const updateListeners = new Set();

if ('serviceWorker' in navigator) {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateListeners.forEach((fn) => fn(true));
    },
  });
}

function Root() {
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    updateListeners.add(setUpdateReady);
    return () => updateListeners.delete(setUpdateReady);
  }, []);
  return (
    <UIProvider>
      <App updateReady={updateReady} onUpdate={() => updateSW?.(true)} />
    </UIProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
