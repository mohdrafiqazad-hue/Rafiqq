import { useCallback, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from './firebase-config.js';
import { DataProvider, useData } from './data/DataContext.jsx';
import { createLocalStore } from './data/localAdapter.js';
import { useUI } from './components/ui.jsx';
import { today } from './lib/dates.js';
import Entry from './screens/Entry.jsx';
import Roz from './screens/Roz.jsx';
import Mahina from './screens/Mahina.jsx';
import Report from './screens/Report.jsx';
import Labours from './screens/Labours.jsx';
import Login from './screens/Login.jsx';
import Kharcha from './screens/Kharcha.jsx';
import { TabIcon } from './components/Icons.jsx';
import { t } from './i18n/index.js';
import { useLang } from './i18n/LangContext.jsx';
import { COMPANY } from './lib/reports.js';

const TABS = ['entry', 'roz', 'mahina', 'kharcha', 'report', 'labour'];

const MODE_KEY = 'mgm-mode';
const getMode = () => {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch {
    return null;
  }
};
const setMode = (m) => {
  try {
    if (m) localStorage.setItem(MODE_KEY, m);
    else localStorage.removeItem(MODE_KEY);
  } catch { /* ignore */ }
};

function StatusPill() {
  const D = useData();
  if (D.storeKind === 'local') return <span className="pill pill-orange">{t('st.demo')}</span>;
  if (!D.online) return <span className="pill pill-orange" title={t('st.offlineTitle')}>{t('st.offline')}</span>;
  if (D.pending) return <span className="pill pill-blue">{t('st.syncing')}</span>;
  return <span className="pill pill-green">{t('st.synced')}</span>;
}

function OfflineBanner() {
  const D = useData();
  if (D.storeKind !== 'firebase' || D.online) return null;
  return <div className="offline-banner">{t('banner.offline')}</div>;
}

/** Tab/date ki state yahan rehti hai, taaki bhasha badalne par bhi wahi screen khuli rahe */
function MainShell(props) {
  const { lang } = useLang();
  const [tab, setTab] = useState('entry');
  const [date, setDate] = useState(today());
  const [labourId, setLabourId] = useState(null);
  const [khataId, setKhataId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const state = { tab, setTab, date, setDate, labourId, setLabourId, khataId, setKhataId, settingsOpen, setSettingsOpen };
  return <Main key={lang} {...props} {...state} />;
}

function Main({ updateReady, onUpdate, tab, setTab, date, setDate, labourId, setLabourId, khataId, setKhataId, settingsOpen, setSettingsOpen }) {
  const goTab = (k) => {
    setTab(k);
    setKhataId(null);
    setSettingsOpen(false);
    window.scrollTo(0, 0);
  };
  const openEntry = (id) => {
    setLabourId(id);
    goTab('entry');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="28" height="28" />
          <div>
            <div className="brand-name">{COMPANY}</div>
            <div className="brand-sub">{t('app.sub')}</div>
          </div>
        </div>
        <StatusPill />
      </header>
      <OfflineBanner />
      {updateReady && (
        <button className="update-banner" onClick={onUpdate}>{t('banner.update')}</button>
      )}
      <main>
        {tab === 'entry' && <Entry date={date} setDate={setDate} labourId={labourId} setLabourId={setLabourId} goTab={goTab} />}
        {tab === 'roz' && <Roz date={date} setDate={setDate} openEntry={openEntry} />}
        {tab === 'mahina' && <Mahina />}
        {tab === 'kharcha' && <Kharcha />}
        {tab === 'report' && <Report date={date} setDate={setDate} />}
        {tab === 'labour' && <Labours khataId={khataId} setKhataId={setKhataId} showSettings={settingsOpen} setShowSettings={setSettingsOpen} />}
      </main>
      <nav className="tabbar">
        {TABS.map((k) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => goTab(k)} aria-current={tab === k ? 'page' : undefined}>
            <TabIcon name={k} />
            <span>{t(`tab.${k}`)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App({ updateReady, onUpdate }) {
  const { toast } = useUI();
  const demoParam = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
  const [mode, setModeState] = useState(() => (getMode() === 'demo' || demoParam ? 'demo' : 'cloud'));
  const [user, setUser] = useState(undefined); // undefined = pata nahi abhi
  const [fb, setFb] = useState(null);

  // Firebase sirf tab load ho jab zaroorat ho
  useEffect(() => {
    if (mode !== 'cloud' || !isFirebaseConfigured) {
      setUser(null);
      return undefined;
    }
    let unsub = () => {};
    let alive = true;
    import('./data/firebaseAdapter.js').then((mod) => {
      if (!alive) return;
      setFb(mod);
      unsub = mod.watchAuth((u) => setUser(u));
    }).catch(() => {
      toast(t('err.appLoad'), 'err', 6000);
      setUser(null);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [mode, toast]);

  const store = useMemo(() => {
    if (mode === 'demo') return createLocalStore();
    if (fb && user) return fb.createFirebaseStore(user.uid);
    return null;
  }, [mode, fb, user]);

  const startDemo = () => {
    setMode('demo');
    setModeState('demo');
  };

  const logout = useCallback(async () => {
    if (mode === 'demo') {
      setMode(null);
      setModeState('cloud');
      if (demoParam) history.replaceState(null, '', location.pathname);
      return;
    }
    await fb?.logout();
  }, [mode, fb, demoParam]);

  const login = async () => {
    try {
      const mod = fb || (await import('./data/firebaseAdapter.js'));
      await mod.login();
    } catch (err) {
      const mod = await import('./data/firebaseAdapter.js');
      toast(mod.authErrorMessage(err), 'err', 7000);
    }
  };

  if (mode === 'cloud' && user === undefined) {
    return <div className="center-screen"><div className="spinner" /><p>{t('loading.app')}</p></div>;
  }
  if (!store) return <Login onLogin={login} onDemo={startDemo} configured={isFirebaseConfigured} />;

  return (
    <DataProvider key={mode + (user?.uid || '')} store={store} user={user} onLogout={logout}>
      <MainShell updateReady={updateReady} onUpdate={onUpdate} />
    </DataProvider>
  );
}
