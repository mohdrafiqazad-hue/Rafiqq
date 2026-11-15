// Saari dates "YYYY-MM-DD" string me rakhi jaati hain (local time), taaki timezone ki gadbad na ho.

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

export const MONTHS_HI = [
  'Janvari', 'Farvari', 'March', 'April', 'Mai', 'June',
  'July', 'August', 'Sitambar', 'Aktubar', 'Navambar', 'Disambar',
];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_HI = ['Ravivar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar'];

/** "15 Nov 2026" */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "Ravivar, 15 Nov 2026" */
export function fmtDateLong(iso) {
  return `${DAYS_HI[fromISO(iso).getDay()]}, ${fmtDate(iso)}`;
}

/** "Navambar 2026" */
export function fmtMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_HI[m - 1]} ${y}`;
}

export function fmtDateTime(d = new Date()) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDate(toISO(d))}, ${h}:${pad(d.getMinutes())} ${ampm}`;
}
