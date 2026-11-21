// WhatsApp message banana aur wa.me link kholna (chuni hui bhasha me)
import { fmtRs, parchi as calcParchi } from './calc.js';
import { fmtDate } from './dates.js';
import { COMPANY } from './reports.js';
import { t } from '../i18n/index.js';

/** "98765 43210" -> "919876543210". Galat number ho to "" */
export function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 11 && d.length <= 15 ? d : '';
}

export function waLink(phone, text) {
  const n = waNumber(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone, text) {
  window.open(waLink(phone, text), '_blank', 'noopener');
}

/** Ek labour ki ek din ki parchi */
export function parchiText(row, date) {
  const P = calcParchi({ c: row.prevC, m: row.prevM }, row, row.k);
  const lines = [`*${COMPANY}*`, t('wa.parchi', { date: fmtDate(date) }), t('wa.labour', { name: row.labour.name }), ''];
  if (!row.entry) {
    lines.push(t('wa.noEntry'), '');
  } else {
    lines.push(
      t('wa.prev', { c: P.prevC }),
      t('wa.taken', { n: P.t }),
      t('wa.ret', { n: P.r }),
      t('wa.inMarket', { n: P.coolerBaaki }),
      '',
      t('wa.lage', { p: P.p, k: fmtRs(P.k), b: fmtRs(P.paisaBane) }),
      t('wa.prevM', { m: fmtRs(P.prevM) }),
      t('wa.mila', { m: fmtRs(P.mila) }),
      '',
    );
  }
  lines.push(t('wa.kul', { c: row.c, m: fmtRs(row.baaki) }));
  return lines.join('\n');
}

/** Pure din ka saar (sab labour) */
export function dayText(day) {
  const lines = [`*${COMPANY}*`, t('wa.dayHead', { date: fmtDate(day.date) }), ''];
  for (const r of day.rows) {
    if (!r.entry) lines.push(t('wa.dayNo', { name: r.labour.name, c: r.c, m: fmtRs(r.baaki) }));
    else lines.push(t('wa.dayRow', { name: r.labour.name, t: r.t, r: r.r, p: r.p, m: fmtRs(r.m), c: r.c, b: fmtRs(r.baaki) }));
  }
  const tt = day.totals;
  lines.push('', t('wa.dayTot', { t: tt.t, r: tt.r, p: tt.p, b: fmtRs(tt.bane), m: fmtRs(tt.m) }));
  lines.push(t('wa.dayBal', { c: tt.c, m: fmtRs(tt.baaki) }));
  return lines.join('\n');
}

/** Poore hafte ka saar (sab labour). pr = periodReport(...) */
export function weekText(pr, label) {
  const lines = [`*${COMPANY}*`, t('wa.weekHead', { label }), ''];
  for (const r of pr.rows) {
    if (!r.days) lines.push(t('wa.weekNo', { name: r.labour.name, c: r.c, bal: fmtRs(r.baaki) }));
    else lines.push(t('wa.weekRow', { name: r.labour.name, d: r.days, t: r.t, r: r.r, p: r.p, b: fmtRs(r.bane), m: fmtRs(r.m), c: r.c, bal: fmtRs(r.baaki) }));
  }
  const tt = pr.totals;
  lines.push('', t('wa.weekTot', { t: tt.t, r: tt.r, p: tt.p, b: fmtRs(tt.bane), m: fmtRs(tt.m) }));
  lines.push(t('wa.dayBal', { c: tt.c, m: fmtRs(tt.baaki) }));
  return lines.join('\n');
}

/** Labour ka khata (period) */
export function khataText(labour, L, label) {
  const lines = [`*${COMPANY}*`, t('wa.khHead', { name: labour.name }), label, ''];
  lines.push(t('wa.khPrev', { c: L.opening.c, m: fmtRs(L.opening.baaki) }));
  const rows = L.rows.slice(-40);
  if (L.rows.length > rows.length) lines.push(t('wa.khSkip', { n: L.rows.length - rows.length }));
  for (const r of rows) {
    if (r.kind === 'ob') lines.push(t('wa.khOb', { date: fmtDate(r.d), c: r.c, m: fmtRs(r.baaki) }));
    else lines.push(t('wa.khRow', { date: fmtDate(r.d), t: r.t, r: r.r, p: r.p, b: fmtRs(r.bane), m: fmtRs(r.m), c: r.c, bal: fmtRs(r.baaki) }));
  }
  const tt = L.totals;
  lines.push('', t('wa.khTot', { t: tt.t, r: tt.r, p: tt.p, b: fmtRs(tt.bane), m: fmtRs(tt.m) }));
  lines.push(t('wa.khNow', { c: tt.c, m: fmtRs(tt.baaki) }));
  return lines.join('\n');
}
