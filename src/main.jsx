import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { UIProvider } from './components/ui.jsx';
import { LangProvider } from './i18n/LangContext.jsx';
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

/** App khulte hi logo (thodi der) */
function Splash() {
  const [phase, setPhase] = useState('show');
  useEffect(() => {
    const a = setTimeout(() => setPhase('hide'), 1300);
    const b = setTimeout(() => setPhase('gone'), 1700);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div className={`splash ${phase === 'hide' ? 'hide' : ''}`} aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}pwa-512.png`} alt="" />
    </div>
  );
}

function Root() {
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    updateListeners.add(setUpdateReady);
    return () => updateListeners.delete(setUpdateReady);
  }, []);
  return (
    <LangProvider>
      <UIProvider>
        <App updateReady={updateReady} onUpdate={() => updateSW?.(true)} />
        <Splash />
      </UIProvider>
    </LangProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
