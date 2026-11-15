// Company ke kharche (diesel, service, salary, driver...)
// Expense: { id, d (date), c (category id), a (amount ₹), p (kisko diya), n (note) }
// Custom category: { id, name }

import { t } from '../i18n/index.js';
import { money, num } from './calc.js';

export const BUILTIN_CATS = ['diesel', 'service', 'salary', 'driver', 'plant', 'bijli', 'kiraya', 'other'];
export const CAT_ICON = {
  diesel: '⛽', service: '🔧', salary: '💼', driver: '🚚', plant: '🏭', bijli: '💡', kiraya: '🏠', other: '📦',
};

/** Saari category (pehle se bani + apni) */
export function allCategories(custom = []) {
  return [
    ...BUILTIN_CATS.map((id) => ({ id, builtin: true })),
    ...custom.filter((c) => c && c.id && !BUILTIN_CATS.includes(c.id)).map((c) => ({ id: c.id, name: c.name })),
  ];
}

export function catName(id, custom = []) {
  if (BUILTIN_CATS.includes(id)) return t(`xcat.${id}`);
  const c = custom.find((x) => x.id === id);
  return c ? c.name : id;
}

export const catIcon = (id) => CAT_ICON[id] || '🏷️';

/** Period ke kharche, date ke hisab se (purane pehle) */
export function expensesIn(expenses, from, to) {
  return expenses
    .filter((x) => (!from || x.d >= from) && (!to || x.d <= to))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.id).localeCompare(String(b.id))));
}

export const totalExpense = (list) => list.reduce((s, x) => money(s + num(x.a)), 0);

/** Category-wise total: [{ id, count, total }] bade se chhote */
export function byCategory(list) {
  const map = new Map();
  for (const x of list) {
    const r = map.get(x.c) || { id: x.c, count: 0, total: 0 };
    r.count += 1;
    r.total = money(r.total + num(x.a));
    map.set(x.c, r);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Period me labour se kitna paisa mila (entries ka m) */
export function receivedIn(entries, from, to) {
  return entries.reduce((s, e) => ((!from || e.d >= from) && (!to || e.d <= to) ? money(s + num(e.m)) : s), 0);
}

/** Saar: mila, kharcha, bachat */
export function expenseSummary(entries, expenses, from, to) {
  const list = expensesIn(expenses, from, to);
  const mila = receivedIn(entries, from, to);
  const kharcha = totalExpense(list);
  return { list, mila, kharcha, bachat: money(mila - kharcha), cats: byCategory(list) };
}

/** Nayi category ka id naam se */
export function newCatId(name, existing) {
  const base = `c_${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20) || 'x'}`;
  let id = base;
  let i = 2;
  const ids = new Set(existing.map((c) => c.id));
  while (ids.has(id) || BUILTIN_CATS.includes(id)) id = `${base}_${i++}`;
  return id;
}
