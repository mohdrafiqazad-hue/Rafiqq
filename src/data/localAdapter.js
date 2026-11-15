// Demo mode: bina login ke, data sirf isi phone/browser me (localStorage) rehta hai.
// Firebase set hone se pehle app try karne ke liye.

import { entryKey } from '../lib/calc.js';
import { mergeData } from '../lib/backup.js';

const KEY = 'mgm-local-data-v1';

function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.labours) && Array.isArray(d.entries)) return d;
  } catch { /* khaali */ }
  return { rate: 10, labours: [], entries: [] };
}

export function createLocalStore() {
  let data = read();
  const listeners = new Set();
  const commit = (next) => {
    data = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      return Promise.reject(new Error('Phone me jagah nahi hai, data save nahi hua.'));
    }
    listeners.forEach((fn) => fn({ ...data }));
    return Promise.resolve();
  };

  return {
    kind: 'local',
    subscribe(onData, onStatus) {
      listeners.add(onData);
      onData({ ...data });
      onStatus({ pending: false });
      return () => listeners.delete(onData);
    },
    saveEntry(e) {
      const k = entryKey(e.l, e.d);
      return commit({ ...data, entries: [...data.entries.filter((x) => entryKey(x.l, x.d) !== k), e] });
    },
    deleteEntry(l, d) {
      const k = entryKey(l, d);
      return commit({ ...data, entries: data.entries.filter((x) => entryKey(x.l, x.d) !== k) });
    },
    saveLabour(lab) {
      const others = data.labours.filter((x) => x.id !== lab.id);
      const clean = { ...lab };
      if (!clean.ob) delete clean.ob;
      return commit({ ...data, labours: [...others, clean] });
    },
    newLabourId() {
      return `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    },
    setRate(rate) {
      return commit({ ...data, rate });
    },
    importData({ labours, entries, rate }) {
      const merged = mergeData(data, { labours, entries });
      return commit({ rate: rate || data.rate, ...merged });
    },
  };
}
