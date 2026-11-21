import { useCallback, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from './firebase-config.js';
import { DataProvider, useData } from './data/DataContext.jsx';
import { createLocalStore } from './data/localAdapter.js';
import { useUI } from './components/ui.jsx';
import { today, weekStart } from './lib/dates.js';
import Entry from './screens/Entry.jsx';
import Roz from './screens/Roz.jsx';
import Mahina from './screens/Mahina.jsx';
import Report from './screens/Report.jsx';
import Labours from './screens/Labours.jsx';
import Login from './screens/Login.jsx';
import Kharcha from './screens/Kharcha.jsx';
import Hafta from './screens/Hafta.jsx';
import Khata from './screens/Khata.jsx';
import Settings from './screens/Settings.jsx';
import Waiting from './screens/Waiting.jsx';
import { TabIcon } from './components/Icons.jsx';
import { t } from './i18n/index.js';
import { useLang } from './i18n/LangContext.jsx';
import { COMPANY } from './lib/reports.js';

// Role ke hisab se tabs: labour ko sirf Entry aur Settings
const TABS_ALL = ['entry', 'roz', 'hafta', 'mahina', 'kharcha', 'report', 'labour'];
const TABS_LABOUR = ['entry', 'settings'];

const ACTIVE_ROLES = ['owner', 'manager', 'labour'];

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

/** Malik ko: kitne log approval ka intezaar kar rahe hain */
function TeamBanner({ onOpen }) {
  const D = useData();
  const n = D.team ? D.team.members.filter((m) => m.role === 'pending').length : 0;
  if (!n) return null;
  return <button className="update-banner team-banner" onClick={onOpen}>{t('tm.banner', { n })}</button>;
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
  const [khata, setKhata] = useState(null); // { id, period } jab kisi labour ka record khula ho
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labourFilter, setLabourFilter] = useState('all'); // all | paisa | cooler
  // Hafta / Mahina tab me chuna hua samay yaad rahe (record dekh kar wapis aane par bhi)
  const [weekWs, setWeekWs] = useState(() => weekStart(today()));
  const [mahinaView, setMahinaView] = useState(() => ({ mode: 'mahina', ws: weekStart(today()), ym: today().slice(0, 7), year: Number(today().slice(0, 4)) }));
  const state = { tab, setTab, date, setDate, labourId, setLabourId, khata, setKhata, settingsOpen, setSettingsOpen, weekWs, setWeekWs, mahinaView, setMahinaView, labourFilter, setLabourFilter };
  return <Main key={lang} {...props} {...state} />;
}

function Main({ updateReady, onUpdate, tab, setTab, date, setDate, labourId, setLabourId, khata, setKhata, settingsOpen, setSettingsOpen, weekWs, setWeekWs, mahinaView, setMahinaView, labourFilter, setLabourFilter }) {
  const D = useData();
  const tabs = D.can.seeReports ? TABS_ALL : TABS_LABOUR;
  const current = tabs.includes(tab) ? tab : 'entry';
  const goTab = (k) => {
    setTab(k);
    setKhata(null);
    setSettingsOpen(false);
    setLabourFilter('all');
    window.scrollTo(0, 0);
  };
  /** Labour ke naam par dabane se uska record (hafta / mahina / saal / poora) */
  const openKhata = (id, period) => {
    setKhata({ id, period });
    window.scrollTo(0, 0);
  };
  const khataLabour = khata && D.can.seeReports ? D.labourById.get(khata.id) : null;
  /** Baaki wali patti se: Labour tab me sirf paisa-baaki ya cooler-baaki wale */
  const openPending = (f) => {
    goTab('labour');
    setLabourFilter(f);
  };
  const openEntry = (id) => {
    setLabourId(id);
    goTab('entry');
  };
  const openTeam = () => {
    goTab('labour');
    setSettingsOpen(true);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}pwa-192.png`} alt="" width="34" height="34" />
          <div>
            <div className="brand-name">{COMPANY}</div>
            <div className="brand-sub">{t('app.sub')}{D.storeKind === 'firebase' ? ` · ${t(`role.${D.role}`)}` : ''}</div>
          </div>
        </div>
        <StatusPill />
      </header>
      <OfflineBanner />
      <TeamBanner onOpen={openTeam} />
      {updateReady && (
        <button className="update-banner" onClick={onUpdate}>{t('banner.update')}</button>
      )}
      <main>
        {khataLabour ? (
          <Khata key={khataLabour.id} labour={khataLabour} initialPeriod={khata.period} onBack={() => setKhata(null)} />
        ) : (
          <>
            {current === 'entry' && <Entry date={date} setDate={setDate} labourId={labourId} setLabourId={setLabourId} goTab={goTab} />}
            {current === 'roz' && <Roz date={date} setDate={setDate} openEntry={openEntry} openKhata={openKhata} openPending={openPending} />}
            {current === 'hafta' && <Hafta ws={weekWs} setWs={setWeekWs} openKhata={openKhata} openPending={openPending} openDay={(d) => { setDate(d); goTab('roz'); }} />}
            {current === 'mahina' && <Mahina view={mahinaView} setView={setMahinaView} openKhata={openKhata} />}
            {current === 'kharcha' && <Kharcha />}
            {current === 'report' && <Report date={date} setDate={setDate} />}
            {current === 'labour' && <Labours setKhataId={(id) => openKhata(id)} showSettings={settingsOpen} setShowSettings={setSettingsOpen} filter={labourFilter} setFilter={setLabourFilter} />}
            {current === 'settings' && <Settings />}
          </>
        )}
      </main>
      <nav className="tabbar">
        {tabs.map((k) => (
          <button key={k} className={current === k ? 'on' : ''} onClick={() => goTab(k)} aria-current={current === k ? 'page' : undefined}>
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
  useLang();
  const demoParam = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
  const [mode, setModeState] = useState(() => (getMode() === 'demo' || demoParam ? 'demo' : 'cloud'));
  const [user, setUser] = useState(undefined); // undefined = pata nahi abhi
  const [fb, setFb] = useState(null);
  const [member, setMember] = useState(null); // { role, ... }
  const [members, setMembers] = useState([]);

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

  // Login ke baad: kya ye user approved hai? (malik / manager / labour / intezaar)
  useEffect(() => {
    setMember(null);
    if (!fb || !user) return undefined;
    return fb.watchMember(user, setMember, (err) => toast(err?.message || String(err), 'err', 6000));
  }, [fb, user, toast]);

  // Malik ko team ki list (nayi requests) chahiye
  const isOwner = member?.role === 'owner';
  useEffect(() => {
    setMembers([]);
    if (!fb || !isOwner) return undefined;
    return fb.watchMembers(setMembers);
  }, [fb, isOwner]);

  const role = mode === 'demo' ? 'owner' : member?.role;
  const active = ACTIVE_ROLES.includes(role);

  const store = useMemo(() => {
    if (mode === 'demo') return createLocalStore();
    if (fb && user && active) return fb.createFirebaseStore(user.uid, role);
    return null;
  }, [mode, fb, user, active, role]);

  const team = useMemo(() => {
    if (!fb || !isOwner) return null;
    return {
      members,
      setRole: (m, r) => fb.setMemberRole(m.uid, r)
        .then(() => toast(r === 'rejected' ? t('tm.rejectedMsg', { name: m.name || m.email }) : t('tm.done', { name: m.name || m.email, role: t(`role.${r}`) })))
        .catch((err) => toast(err?.message || String(err), 'err', 6000)),
      remove: (m) => fb.removeMember(m.uid)
        .then(() => toast(t('tm.removed', { name: m.name || m.email })))
        .catch((err) => toast(err?.message || String(err), 'err', 6000)),
    };
  }, [fb, isOwner, members, toast]);

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

  const spinner = (msg) => <div className="center-screen"><div className="spinner" /><p>{msg}</p></div>;

  if (mode === 'cloud' && user === undefined) return spinner(t('loading.app'));
  if (mode === 'cloud' && !user) return <Login onLogin={login} onDemo={startDemo} configured={isFirebaseConfigured} />;
  if (mode === 'cloud' && !active) {
    if (!member || member.role === 'loading' || member.role === 'none') return spinner(t('w.checking'));
    return <Waiting user={user} role={member.role} onLogout={logout} />;
  }
  if (!store) return <Login onLogin={login} onDemo={startDemo} configured={isFirebaseConfigured} />;

  return (
    <DataProvider key={mode + (user?.uid || '') + role} store={store} user={user} role={role} team={team} onLogout={logout}>
      <MainShell updateReady={updateReady} onUpdate={onUpdate} />
    </DataProvider>
  );
}
