// Bhasha (language) system: Hinglish (hl), English (en), हिंदी (hi).
// t('key', { var }) se string milti hai. Jo bhasha chuni hai, poora app usi me chalta hai.

import { STRINGS } from './strings.js';

export const LANGS = [
  ['hl', 'Hinglish'],
  ['en', 'English'],
  ['hi', 'हिंदी'],
];
const IDX = { hl: 0, en: 1, hi: 2 };
const KEY = 'mgm-lang';

function initial() {
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in IDX) return v;
  } catch { /* ignore */ }
  return 'hl';
}

let lang = typeof localStorage === 'undefined' ? 'hl' : initial();

export const getLang = () => lang;

export function setLang(l) {
  if (!(l in IDX)) return;
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l === 'en' ? 'en' : 'hi';
}

export function hasChosenLang() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return true;
  }
}

/** Translate. Bhasha me na mile to Hinglish, phir key hi lauta do. */
export function t(key, vars) {
  const row = STRINGS[key];
  let s = row ? (row[IDX[lang]] ?? row[0]) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
