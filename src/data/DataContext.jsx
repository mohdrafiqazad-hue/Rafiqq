// Poore app ka data aur "actions" (save, delete...) yahan se milte hain.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useUI } from '../components/ui.jsx';
import { entryKey, fmtRs, groupByLabour, sortLabours } from '../lib/calc.js';
import { t } from '../i18n/index.js';

const DataCtx = createContext(null);


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

/** Role ke hisab se kya-kya kar sakte hain (asli rok firestore.rules me hai, ye sirf UI ke liye) */
export function permissions(role) {
  const owner = role === 'owner';
  const manager = owner || role === 'manager';
  return {
    owner,
    addEntry: manager || role === 'labour',
    editEntry: owner,
    addLabour: manager,
    editLabour: owner,
    seeReports: manager,
    seeKharcha: manager,
    addKharcha: manager,
    editKharcha: owner,
    settings: owner,
    team: owner,
  };
}

function errMsg(err, role) {
  if (err?.code === 'permission-denied') return role === 'owner' ? t('msg.perm') : t('pm.denied');
  if (err?.code === 'resource-exhausted') return t('msg.quota');
  if (err?.code === 'unavailable') return t('msg.offline');
  return err?.message || t('msg.unknown');
}

export function DataProvider({ store, user, role = 'owner', team = null, onLogout, children }) {
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
      (err) => setLoadError(errMsg(err, role)),
    );
  }, [store]);

  /** Write chalao; turant feedback do (offline ho to bhi data phone me save ho chuka hota hai) */
  const run = useCallback((promise, okMsg) => {
    Promise.resolve(promise).catch((err) => toast(t('msg.saveFail', { e: errMsg(err, role) }), 'err', 6000));
    if (okMsg) {
      if (store.kind === 'firebase' && !navigator.onLine) toast(t('msg.offline'), 'warn', 5000);
      else toast(okMsg, 'ok');
    }
  }, [store, toast, role]);

  const value = useMemo(() => {
    if (!data) return null;
    const labours = sortLabours(data.labours);
    const active = labours.filter((l) => !l.archived);
    const entryIndex = new Map(data.entries.map((e) => [entryKey(e.l, e.d), e]));
    return {
      user,
      role,
      can: permissions(role),
      team,
      storeKind: store.kind,
      online,
      pending,
      rate: data.rate,
      labours,
      active,
      entries: data.entries,
      expenses: data.expenses || [],
      xcats: data.xcats || [],
      byLabour: groupByLabour(data.entries),
      labourById: new Map(labours.map((l) => [l.id, l])),
      getEntry: (l, d) => entryIndex.get(entryKey(l, d)) || null,
      saveEntry: (e, isUpdate) => {
        // Kisne entry ki (malik ke WhatsApp message me dikhta hai). Badalne par asli likhne wala hi rehta hai.
        const old = entryIndex.get(entryKey(e.l, e.d));
        const who = user?.name || user?.email || (store.kind === 'local' ? 'Demo' : '');
        const meta = old && isUpdate
          ? { by: old.by || '', byRole: old.byRole || '', at: old.at || '', editedBy: who, editedAt: new Date().toISOString() }
          : { by: who, byRole: role, at: new Date().toISOString() };
        run(store.saveEntry({ ...e, ...meta }), isUpdate ? t('msg.updated') : t('msg.saved'));
      },
      deleteEntry: (l, d) => run(store.deleteEntry(l, d), t('msg.deleted')),
      saveLabour: (lab, msg) => run(store.saveLabour(lab), msg || t('msg.labourSaved')),
      addLabour: (name, phone) => {
        const id = store.newLabourId();
        const o = labours.reduce((mx, l) => Math.max(mx, Number(l.o) || 0), -1) + 1;
        run(store.saveLabour({ id, name, phone, archived: false, o }), t('msg.labourAdded', { name }));
        return id;
      },
      setRate: (r) => run(store.setRate(r), t('msg.rate', { r: fmtRs(r) })),
      saveExpense: (x, oldDate) => {
        const item = x.id ? x : { ...x, id: store.newExpenseId() };
        run(store.saveExpense(item, oldDate), t('msg.xSaved'));
      },
      deleteExpense: (x) => run(store.deleteExpense(x), t('msg.xDeleted')),
      setCategories: (cats) => run(store.setCategories(cats), t('msg.catsSaved')),
      importData: (payload) => {
        // Category: purani + file wali dono rakho
        const cur = data.xcats || [];
        const extra = (payload.xcats || []).filter((c) => !cur.some((x) => x.id === c.id));
        run(store.importData({ ...payload, xcats: extra.length ? [...cur, ...extra] : null }), t('msg.imported'));
      },
      logout: onLogout,
    };
  }, [data, store, user, role, team, online, pending, run, onLogout]);

  if (loadError && !data) {
    return (
      <div className="center-screen">
        <p className="error-box">{loadError}</p>
        <button className="btn" onClick={onLogout}>{t('c.logout')}</button>
      </div>
    );
  }
  if (!value) return <div className="center-screen"><div className="spinner" /><p>{t('loading.data')}</p></div>;
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
