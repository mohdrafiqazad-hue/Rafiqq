// Saari dates "YYYY-MM-DD" string me rakhi jaati hain (local time), taaki timezone ki gadbad na ho.

import { getLang } from '../i18n/index.js';

const pad = (n) => String(n).padStart(2, '0');

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toISO(new Date());
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function isValidISO(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISO(fromISO(s)) === s;
}

/** "2026-11" */
export function monthKey(iso) {
  return iso.slice(0, 7);
}

export function monthStart(ym) {
  return `${ym}-01`;
}

export function monthEnd(ym) {
  const [y, m] = ym.split('-').map(Number);
  return toISO(new Date(y, m, 0));
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const MONTHS = {
  hl: ['Janvari', 'Farvari', 'March', 'April', 'Mai', 'June', 'July', 'August', 'Sitambar', 'Aktubar', 'Navambar', 'Disambar'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
};
const MONTHS_SHORT = {
  hl: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
};
const DAYS = {
  hl: ['Ravivar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
};

const WEEKDAYS = {
  hl: ['Ra', 'So', 'Ma', 'Bu', 'Gu', 'Shu', 'Sha'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  hi: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
};
export const weekdayNames = () => WEEKDAYS[getLang()];

/** Mahine ka calendar: 6 hafte x 7 din, har cell "YYYY-MM-DD" ya null (khaali) */
export function monthGrid(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** "15 Nov 2026" */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[getLang()][m - 1]} ${y}`;
}

/** "Ravivar, 15 Nov 2026" */
export function fmtDateLong(iso) {
  return `${DAYS[getLang()][fromISO(iso).getDay()]}, ${fmtDate(iso)}`;
}

/** "Navambar 2026" */
export function fmtMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[getLang()][m - 1]} ${y}`;
}

export function fmtDateTime(d = new Date()) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDate(toISO(d))}, ${h}:${pad(d.getMinutes())} ${ampm}`;
}
