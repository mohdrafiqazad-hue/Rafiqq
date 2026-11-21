// Backup banana, backup file padhna aur purane data ke saath milana (merge).

import { isValidISO } from './dates.js';
import { entryKey, num } from './calc.js';

export const APP_ID = 'madhur-ganga-cooler';

/** Firestore document id me "/" jaise characters nahi chal sakte, unhe theek karo. */
export function safeId(id) {
  let s = String(id ?? '').trim().replace(/\//g, '_');
  if (!s || s === '.' || s === '..' || /^__.*__$/.test(s)) s = `L${s.replace(/\./g, '_')}`;
  return s.slice(0, 200);
}

function bkError(code, message, vars) {
  const err = new Error(message);
  err.code = code;
  err.vars = vars;
  return err;
}

const cleanExpense = (x) => ({
  id: x.id, d: x.d, c: String(x.c || 'other'), a: num(x.a), p: String(x.p || ''), n: String(x.n || ''),
});

export function buildBackup({ rate, labours, entries, expenses = [], xcats = [] }) {
  return {
    app: APP_ID,
    v: 1,
    exportedAt: new Date().toISOString(),
    rate: num(rate) || 10,
    labours: labours.map((l) => {
      const out = { id: l.id, name: l.name, phone: l.phone || '', archived: !!l.archived };
      if (l.o !== undefined) out.o = l.o;
      if (l.nameHi) out.nameHi = l.nameHi;
      if (l.nameEn) out.nameEn = l.nameEn;
      if (l.ob && l.ob.d) out.ob = { d: l.ob.d, c: num(l.ob.c), m: num(l.ob.m) };
      return out;
    }),
    entries: [...entries]
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.l).localeCompare(String(b.l))))
      .map((e) => ({ l: e.l, d: e.d, t: num(e.t), r: num(e.r), p: num(e.p), m: num(e.m), k: num(e.k) })),
    expenses: [...expenses].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)).map(cleanExpense),
    xcats: xcats.map((c) => ({ id: c.id, name: c.name })),
  };
}

/**
 * Backup file ka text padh kar saaf data lautata hai.
 * Galti ho to Hinglish message ke saath Error throw karta hai.
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw bkError('bk.notjson', 'Ye file sahi backup (JSON) file nahi hai.');
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.labours) || !Array.isArray(data.entries)) {
    throw bkError('bk.nodata', 'Is file me labour/entries ka data nahi mila. Sahi backup file chunein.');
  }
  if (data.app && data.app !== APP_ID) {
    throw bkError('bk.otherapp', `Ye file kisi doosre app ki hai ("${data.app}").`, { app: data.app });
  }

  const fileRate = num(data.rate) > 0 ? num(data.rate) : null;
  const idMap = new Map();
  const labours = [];
  data.labours.forEach((l, i) => {
    if (!l || l.id === undefined || l.id === null) return;
    const id = safeId(l.id);
    idMap.set(String(l.id), id);
    const lab = {
      id,
      name: String(l.name ?? '').trim() || `Labour ${i + 1}`,
      phone: String(l.phone ?? '').trim(),
      archived: !!l.archived,
      o: l.o !== undefined ? num(l.o) : i,
    };
    if (l.ob && isValidISO(l.ob.d)) lab.ob = { d: l.ob.d, c: num(l.ob.c), m: num(l.ob.m) };
    if (l.nameHi) lab.nameHi = String(l.nameHi).trim();
    if (l.nameEn) lab.nameEn = String(l.nameEn).trim();
    labours.push(lab);
  });

  const entryMap = new Map();
  let skipped = 0;
  for (const e of data.entries) {
    const l = e && idMap.get(String(e.l));
    if (!l || !isValidISO(e.d)) {
      skipped++;
      continue;
    }
    const k = e.k !== undefined && e.k !== null && e.k !== '' ? num(e.k) : (fileRate ?? 10);
    // Ek hi labour + date do baar ho to file me baad wali entry rakho
    entryMap.set(entryKey(l, e.d), { l, d: e.d, t: num(e.t), r: num(e.r), p: num(e.p), m: num(e.m), k });
  }

  // Kharche (naye app ke backup me hote hain; purani file me nahi)
  const expMap = new Map();
  if (Array.isArray(data.expenses)) {
    for (const x of data.expenses) {
      if (!x || x.id === undefined || !isValidISO(x.d) || !(num(x.a) > 0)) {
        skipped++;
        continue;
      }
      const ex = cleanExpense(x);
      ex.id = safeId(x.id);
      expMap.set(ex.id, ex);
    }
  }
  const xcats = Array.isArray(data.xcats)
    ? data.xcats.filter((c) => c && c.id && c.name).map((c) => ({ id: safeId(c.id), name: String(c.name).trim() }))
    : [];

  return {
    rate: fileRate,
    labours,
    entries: [...entryMap.values()],
    expenses: [...expMap.values()],
    xcats,
    skipped,
    exportedAt: data.exportedAt || null,
  };
}

/**
 * Import ka plan: kya naya aayega, kya badlega.
 * Same labour + same date ki entry ho to file wali entry rakhi jaati hai.
 */
export function planImport(current, incoming) {
  const curLabours = new Map(current.labours.map((l) => [l.id, l]));
  const curEntries = new Set(current.entries.map((e) => entryKey(e.l, e.d)));
  let newLabours = 0;
  let updatedLabours = 0;
  let newEntries = 0;
  let replacedEntries = 0;
  for (const l of incoming.labours) (curLabours.has(l.id) ? updatedLabours++ : newLabours++);
  for (const e of incoming.entries) (curEntries.has(entryKey(e.l, e.d)) ? replacedEntries++ : newEntries++);
  const curExp = new Set((current.expenses || []).map((x) => x.id));
  let newExpenses = 0;
  let replacedExpenses = 0;
  for (const x of incoming.expenses || []) (curExp.has(x.id) ? replacedExpenses++ : newExpenses++);
  return {
    expenseCount: (incoming.expenses || []).length,
    newExpenses,
    replacedExpenses,
    labourCount: incoming.labours.length,
    entryCount: incoming.entries.length,
    newLabours,
    updatedLabours,
    newEntries,
    replacedEntries,
    skipped: incoming.skipped || 0,
    rate: incoming.rate,
  };
}

/** Merge ka nateeja (tests aur local storage ke liye). */
export function mergeData(current, incoming) {
  const labours = new Map(current.labours.map((l) => [l.id, { ...l }]));
  for (const l of incoming.labours) labours.set(l.id, { ...labours.get(l.id), ...l });
  const entries = new Map(current.entries.map((e) => [entryKey(e.l, e.d), e]));
  for (const e of incoming.entries) entries.set(entryKey(e.l, e.d), e);
  const expenses = new Map((current.expenses || []).map((x) => [x.id, x]));
  for (const x of incoming.expenses || []) expenses.set(x.id, x);
  const xcats = new Map((current.xcats || []).map((c) => [c.id, c]));
  for (const c of incoming.xcats || []) xcats.set(c.id, c);
  return {
    labours: [...labours.values()],
    entries: [...entries.values()],
    expenses: [...expenses.values()],
    xcats: [...xcats.values()],
  };
}
