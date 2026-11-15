// Poore app ka data aur "actions" (save, delete...) yahan se milte hain.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useUI } from '../components/ui.jsx';
import { entryKey, groupByLabour, sortLabours } from '../lib/calc.js';

const DataCtx = createContext(null);

export const OFFLINE_MSG = 'Internet nahi hai, entry phone me save hai, net aate hi sync ho jayegi';

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function errMsg(err) {
  if (err?.code === 'permission-denied') return 'Permission nahi hai. Firebase ke Firestore rules check karein (README dekhein).';
  if (err?.code === 'resource-exhausted') return 'Firebase ki aaj ki free limit poori ho gayi. Kal phir chalega.';
  if (err?.code === 'unavailable') return OFFLINE_MSG;
  return err?.message || 'Kuch galat ho gaya. Dobara try karein.';
}

export function DataProvider({ store, user, onLogout, children }) {
  const { toast } = useUI();
  const online = useOnline();
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setData(null);
    return store.subscribe(
      (d) => setData(d),
      (s) => setPending(s.pending),
      (err) => setLoadError(errMsg(err)),
    );
  }, [store]);

  /** Write chalao; turant feedback do (offline ho to bhi data phone me save ho chuka hota hai) */
  const run = useCallback((promise, okMsg) => {
    Promise.resolve(promise).catch((err) => toast(`Save nahi hua: ${errMsg(err)}`, 'err', 6000));
    if (okMsg) {
      if (store.kind === 'firebase' && !navigator.onLine) toast(OFFLINE_MSG, 'warn', 5000);
      else toast(okMsg, 'ok');
    }
  }, [store, toast]);

  const value = useMemo(() => {
    if (!data) return null;
    const labours = sortLabours(data.labours);
    const active = labours.filter((l) => !l.archived);
    const entryIndex = new Map(data.entries.map((e) => [entryKey(e.l, e.d), e]));
    return {
      user,
      storeKind: store.kind,
      online,
      pending,
      rate: data.rate,
      labours,
      active,
      entries: data.entries,
      byLabour: groupByLabour(data.entries),
      labourById: new Map(labours.map((l) => [l.id, l])),
      getEntry: (l, d) => entryIndex.get(entryKey(l, d)) || null,
      saveEntry: (e, isUpdate) => run(store.saveEntry(e), isUpdate ? 'Entry update ho gayi ✓' : 'Entry save ho gayi ✓'),
      deleteEntry: (l, d) => run(store.deleteEntry(l, d), 'Entry delete ho gayi'),
      saveLabour: (lab, msg) => run(store.saveLabour(lab), msg || 'Labour save ho gaya ✓'),
      addLabour: (name, phone) => {
        const id = store.newLabourId();
        const o = labours.reduce((mx, l) => Math.max(mx, Number(l.o) || 0), -1) + 1;
        run(store.saveLabour({ id, name, phone, archived: false, o }), `${name} jud gaya ✓`);
        return id;
      },
      setRate: (r) => run(store.setRate(r), `Rate ₹${r} ho gaya ✓`),
      importData: (payload) => run(store.importData(payload), 'Data aa gaya ✓'),
      logout: onLogout,
    };
  }, [data, store, user, online, pending, run, onLogout]);

  if (loadError && !data) {
    return (
      <div className="center-screen">
        <p className="error-box">{loadError}</p>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>
    );
  }
  if (!value) return <div className="center-screen"><div className="spinner" /><p>Data load ho raha hai…</p></div>;
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
