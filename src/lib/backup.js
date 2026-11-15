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

export function buildBackup({ rate, labours, entries }) {
  return {
    app: APP_ID,
    v: 1,
    exportedAt: new Date().toISOString(),
    rate: num(rate) || 10,
    labours: labours.map((l) => {
      const out = { id: l.id, name: l.name, phone: l.phone || '', archived: !!l.archived };
      if (l.o !== undefined) out.o = l.o;
      if (l.ob && l.ob.d) out.ob = { d: l.ob.d, c: num(l.ob.c), m: num(l.ob.m) };
      return out;
    }),
    entries: [...entries]
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.l).localeCompare(String(b.l))))
      .map((e) => ({ l: e.l, d: e.d, t: num(e.t), r: num(e.r), p: num(e.p), m: num(e.m), k: num(e.k) })),
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
    throw new Error('Ye file sahi backup (JSON) file nahi hai.');
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.labours) || !Array.isArray(data.entries)) {
    throw new Error('Is file me labour/entries ka data nahi mila. Sahi backup file chunein.');
  }
  if (data.app && data.app !== APP_ID) {
    throw new Error(`Ye file kisi doosre app ki hai ("${data.app}").`);
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

  return { rate: fileRate, labours, entries: [...entryMap.values()], skipped, exportedAt: data.exportedAt || null };
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
  return {
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
  return { labours: [...labours.values()], entries: [...entries.values()] };
}
