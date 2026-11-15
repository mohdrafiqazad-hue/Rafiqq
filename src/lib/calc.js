// Saara hisab yahin hota hai. Ye file sirf "pure" functions rakhti hai (koi Firebase/UI nahi),
// taaki iske unit tests aasaani se ban sakein.
//
// Labour : { id, name, phone, archived, o (order), ob?: { d, c, m } }
//          ob = opening balance (pichla baaki): "d" date ke din ke ant tak
//          c cooler aur m rupaye baaki the. "d" ke baad ka baaki isi se shuru hota hai,
//          yaani d tak ki app wali entries iske andar shaamil maani jaati hain.
// Entry  : { l, d, t, r, p, m, k }
//          t = cooler le gaye, r = wapis aaye, p = market me lage,
//          m = paisa mila (₹), k = us din ka rate

import { addDays, monthStart, monthEnd } from './dates.js';

export const num = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

/** Paise ki float gadbad (0.1+0.2) se bachne ke liye 2 decimal tak round */
export const money = (x) => Math.round(num(x) * 100) / 100;

/** Ek entry ka paisa bane = p × k */
export const bane = (e) => money(num(e.p) * num(e.k));

export const entryKey = (labourId, date) => `${labourId}_${date}`;

export function sortLabours(labours) {
  return [...labours].sort(
    (a, b) => num(a.o) - num(b.o) || String(a.name).localeCompare(String(b.name)),
  );
}

/** Kya opening balance is date tak lag chuka hai? */
export function obApplies(labour, date) {
  return !!(labour && labour.ob && labour.ob.d && labour.ob.d <= date);
}

/** labourId -> us labour ki entries (date ke hisab se sorted) */
export function groupByLabour(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.l)) map.set(e.l, []);
    map.get(e.l).push(e);
  }
  for (const list of map.values()) list.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return map;
}

/**
 * Kisi date tak (us din ko mila kar) ka baaki.
 *   Cooler baaki = opening cooler + Σ(t − r)
 *   Paisa baaki  = opening paisa  + Σ(p×k − m)
 */
export function balanceAt(labour, labourEntries, date) {
  let c = 0;
  let m = 0;
  let after = '';
  if (obApplies(labour, date)) {
    c = num(labour.ob.c);
    m = num(labour.ob.m);
    after = labour.ob.d;
  }
  for (const e of labourEntries) {
    if (e.d > date) break;
    if (e.d <= after) continue;
    c += num(e.t) - num(e.r);
    m += bane(e) - num(e.m);
  }
  return { c, m: money(m) };
}

/** Kisi date se pehle (us din ko chhod kar) ka baaki = "pichla baaki" */
export function balanceBefore(labour, labourEntries, date) {
  return balanceAt(labour, labourEntries, addDays(date, -1));
}

/**
 * Entry screen ki "parchi" ka hisab.
 * prev = pichla baaki { c, m }, input = { t, r, p, m }, rate = k
 */
export function parchi(prev, input, rate) {
  const t = num(input.t);
  const r = num(input.r);
  const p = num(input.p);
  const mila = num(input.m);
  const k = num(rate);
  const paisaBane = money(p * k);
  const coolerBaaki = num(prev.c) + t - r;
  const kulPaisaBaaki = money(num(prev.m) + paisaBane - mila);
  return {
    prevC: num(prev.c),
    prevM: money(prev.m),
    t, r, p, mila, k,
    paisaBane,
    coolerBaaki,
    kulPaisaBaaki,
    /** wapis aaye > (pichla baaki + le gaye) */
    tooManyReturned: r > num(prev.c) + t,
  };
}

/** Agla labour jiski is date ki entry abhi nahi hui. Sab ho gaye to null. */
export function nextPendingLabour(activeLabours, doneIds, currentId) {
  const list = sortLabours(activeLabours);
  if (!list.length) return null;
  const start = Math.max(0, list.findIndex((l) => l.id === currentId));
  for (let i = 1; i <= list.length; i++) {
    const cand = list[(start + i) % list.length];
    if (!doneIds.has(cand.id)) return cand.id;
  }
  return null;
}

const emptyTotals = () => ({ t: 0, r: 0, p: 0, bane: 0, m: 0, c: 0, baaki: 0 });

function addTo(tot, row) {
  tot.t += num(row.t);
  tot.r += num(row.r);
  tot.p += num(row.p);
  tot.bane = money(tot.bane + num(row.bane));
  tot.m = money(tot.m + num(row.m));
  tot.c += num(row.c);
  tot.baaki = money(tot.baaki + num(row.baaki));
}

/**
 * Roz ka hisab: ek din ke sab labour.
 * Row: { labour, entry, t, r, p, bane, m, c (cooler baaki), baaki (paisa baaki), prevC, prevM, k }
 */
export function dayReport(labours, entries, date) {
  const byL = groupByLabour(entries);
  const rows = [];
  for (const labour of sortLabours(labours)) {
    const list = byL.get(labour.id) || [];
    const entry = list.find((e) => e.d === date) || null;
    if (labour.archived && !entry) continue;
    const prev = balanceBefore(labour, list, date);
    const bal = balanceAt(labour, list, date);
    rows.push({
      labour,
      entry,
      t: entry ? num(entry.t) : 0,
      r: entry ? num(entry.r) : 0,
      p: entry ? num(entry.p) : 0,
      k: entry ? num(entry.k) : 0,
      bane: entry ? bane(entry) : 0,
      m: entry ? num(entry.m) : 0,
      prevC: prev.c,
      prevM: prev.m,
      c: bal.c,
      baaki: bal.m,
    });
  }
  const totals = emptyTotals();
  rows.forEach((r) => addTo(totals, r));
  return { date, rows, totals };
}

/**
 * Kisi period (from..to) ka labour-wise hisab.
 * t/r/p/bane/m sirf us period ke, lekin c/baaki shuru se period ke aakhir tak (running total).
 */
export function periodReport(labours, entries, from, to) {
  const byL = groupByLabour(entries);
  const rows = [];
  for (const labour of sortLabours(labours)) {
    const list = byL.get(labour.id) || [];
    const inPeriod = list.filter((e) => e.d >= from && e.d <= to);
    const bal = balanceAt(labour, list, to);
    if (labour.archived && !inPeriod.length && !bal.c && !bal.m) continue;
    const row = { labour, days: inPeriod.length, t: 0, r: 0, p: 0, bane: 0, m: 0 };
    for (const e of inPeriod) {
      row.t += num(e.t);
      row.r += num(e.r);
      row.p += num(e.p);
      row.bane = money(row.bane + bane(e));
      row.m = money(row.m + num(e.m));
    }
    const prev = balanceBefore(labour, list, from);
    row.prevC = prev.c;
    row.prevM = prev.m;
    row.c = bal.c;
    row.baaki = bal.m;
    rows.push(row);
  }
  const totals = emptyTotals();
  rows.forEach((r) => addTo(totals, r));
  return { from, to, rows, totals };
}

/** Saal ka mahine-wise hisab. c/baaki har mahine ke aakhir tak ka (sab labour mila kar). */
export function yearByMonth(labours, entries, year, uptoMonth = 12) {
  const rows = [];
  for (let mo = 1; mo <= uptoMonth; mo++) {
    const ym = `${year}-${String(mo).padStart(2, '0')}`;
    const pr = periodReport(labours, entries, monthStart(ym), monthEnd(ym));
    rows.push({ ym, ...pr.totals });
  }
  const totals = { t: 0, r: 0, p: 0, bane: 0, m: 0 };
  for (const r of rows) {
    totals.t += r.t;
    totals.r += r.r;
    totals.p += r.p;
    totals.bane = money(totals.bane + r.bane);
    totals.m = money(totals.m + r.m);
  }
  const last = rows[rows.length - 1];
  totals.c = last ? last.c : 0;
  totals.baaki = last ? last.baaki : 0;
  return { year, rows, totals };
}

/**
 * Labour ka khata (running balance).
 * from/to optional. Pehli row "Pichla baaki" hoti hai.
 * Row: { kind: 'opening'|'ob'|'entry', d, t, r, p, k, bane, m, c, baaki }
 */
export function ledger(labour, entries, from = null, to = null) {
  const list = (groupByLabour(entries.filter((e) => e.l === labour.id)).get(labour.id) || []);
  const events = [];
  if (labour.ob && labour.ob.d) events.push({ kind: 'ob', d: labour.ob.d, c: num(labour.ob.c), m: num(labour.ob.m) });
  for (const e of list) events.push({ kind: 'entry', d: e.d, e });
  // Opening balance us din ke ant ka hai, isliye same date ki entry ke baad aata hai aur baaki ko set kar deta hai
  events.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.kind === 'ob') - (b.kind === 'ob')));

  let c = 0;
  let m = 0;
  const rows = [];
  let opening = null;
  const totals = { t: 0, r: 0, p: 0, bane: 0, m: 0 };
  for (const ev of events) {
    if (from && ev.d < from) {
      if (ev.kind === 'ob') { c = ev.c; m = ev.m; } else {
        c += num(ev.e.t) - num(ev.e.r);
        m = money(m + bane(ev.e) - num(ev.e.m));
      }
      continue;
    }
    if (to && ev.d > to) break;
    if (!opening) opening = { kind: 'opening', d: from, c, baaki: money(m) };
    if (ev.kind === 'ob') {
      c = ev.c;
      m = ev.m;
      rows.push({ kind: 'ob', d: ev.d, t: 0, r: 0, p: 0, k: 0, bane: 0, m: 0, c, baaki: money(m) });
    } else {
      const e = ev.e;
      const b = bane(e);
      c += num(e.t) - num(e.r);
      m = money(m + b - num(e.m));
      rows.push({ kind: 'entry', d: e.d, t: num(e.t), r: num(e.r), p: num(e.p), k: num(e.k), bane: b, m: num(e.m), c, baaki: m });
      totals.t += num(e.t);
      totals.r += num(e.r);
      totals.p += num(e.p);
      totals.bane = money(totals.bane + b);
      totals.m = money(totals.m + num(e.m));
    }
  }
  if (!opening) opening = { kind: 'opening', d: from, c, baaki: money(m) };
  totals.c = rows.length ? rows[rows.length - 1].c : opening.c;
  totals.baaki = rows.length ? rows[rows.length - 1].baaki : opening.baaki;
  return { opening, rows, totals };
}

/** Rupaye dikhane ka tareeka: "₹1,250" ya "-₹50" */
export function fmtRs(x) {
  const v = money(x);
  const abs = Math.abs(v);
  const s = abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${v < 0 ? '-' : ''}₹${s}`;
}

export function fmtNum(x) {
  return money(x).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
