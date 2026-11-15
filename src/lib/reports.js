// Report ka "model" banata hai: title + sections (columns, rows, total).
// Isi model se screen par table, PDF, Word aur Excel teeno bante hain.
// Row ke cells: number (formatting baad me hoti hai) ya string.

import { dayReport, periodReport, yearByMonth, ledger } from './calc.js';
import { fmtDate, fmtDateLong, fmtMonth, monthStart, monthEnd } from './dates.js';

export const COMPANY = 'Madhur Ganga Minerals';

/** File ke naam ke liye sirf English letters/numbers (kai phones Hindi file-naam theek se nahi lete) */
export const asciiName = (s) => String(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

const col = (key, label, opts = {}) => ({ key, label, align: 'right', ...opts });

const ACTIVITY_COLS = [
  col('t', 'Le gaye'),
  col('r', 'Wapis'),
  col('p', 'Lage'),
  col('bane', 'Paisa bane', { money: true }),
  col('m', 'Mila', { money: true }),
  col('c', 'Cooler baaki'),
  col('baaki', 'Paisa baaki', { money: true }),
];

const totalRow = (first, tot, keys) => [first, ...keys.map((k) => tot[k])];
const ACT_KEYS = ['t', 'r', 'p', 'bane', 'm', 'c', 'baaki'];

export function buildDayReport(labours, entries, date) {
  const d = dayReport(labours, entries, date);
  const done = d.rows.filter((r) => r.entry).length;
  return {
    kind: 'din',
    title: `Roz ka Hisab - ${fmtDate(date)}`,
    subtitle: `${fmtDateLong(date)} · ${done}/${d.rows.length} labour ki entry`,
    file: `Roz_${date}`,
    sections: [{
      columns: [col('name', 'Labour', { align: 'left', wide: true }), ...ACTIVITY_COLS],
      rows: d.rows.map((r) => (r.entry
        ? [r.labour.name, r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]
        : [`${r.labour.name} (entry nahi)`, '-', '-', '-', '-', '-', r.c, r.baaki])),
      total: totalRow('Kul', d.totals, ACT_KEYS),
    }],
  };
}

function labourPeriodSection(labours, entries, from, to, heading) {
  const p = periodReport(labours, entries, from, to);
  return {
    heading,
    columns: [col('name', 'Labour', { align: 'left', wide: true }), col('days', 'Din'), ...ACTIVITY_COLS],
    rows: p.rows.map((r) => [r.labour.name + (r.labour.archived ? ' (hataya)' : ''), r.days, r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]),
    total: ['Kul', p.rows.reduce((s, r) => s + r.days, 0), ...ACT_KEYS.map((k) => p.totals[k])],
  };
}

export function buildMonthReport(labours, entries, ym) {
  return {
    kind: 'mahina',
    title: `Mahina Report - ${fmtMonth(ym)}`,
    subtitle: `${fmtDate(monthStart(ym))} se ${fmtDate(monthEnd(ym))} · Cooler/Paisa baaki shuru se mahine ke aakhir tak`,
    file: `Mahina_${ym}`,
    sections: [labourPeriodSection(labours, entries, monthStart(ym), monthEnd(ym))],
  };
}

export function buildYearReport(labours, entries, year) {
  const y = yearByMonth(labours, entries, year);
  return {
    kind: 'saal',
    title: `Saal Report - ${year}`,
    subtitle: 'Cooler/Paisa baaki har mahine ke aakhir tak ka (shuru se)',
    file: `Saal_${year}`,
    sections: [
      {
        heading: 'Mahine-wise',
        columns: [col('month', 'Mahina', { align: 'left', wide: true }), ...ACTIVITY_COLS],
        rows: y.rows.map((r) => [fmtMonth(r.ym), r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]),
        total: totalRow('Kul', y.totals, ACT_KEYS),
      },
      labourPeriodSection(labours, entries, `${year}-01-01`, `${year}-12-31`, 'Labour-wise'),
    ],
  };
}

/** period: { mode: 'mahina'|'saal'|'poora', ym?, year? } */
export function periodRange(period) {
  if (period.mode === 'mahina') return { from: monthStart(period.ym), to: monthEnd(period.ym), label: fmtMonth(period.ym) };
  if (period.mode === 'saal') return { from: `${period.year}-01-01`, to: `${period.year}-12-31`, label: String(period.year) };
  return { from: null, to: null, label: 'Poora hisab' };
}

export function buildLabourReport(labour, entries, period) {
  const { from, to, label } = periodRange(period);
  const L = ledger(labour, entries, from, to);
  const rows = [];
  rows.push([from ? 'Pichla baaki' : 'Shuruaat', '', '', '', '', '', '', L.opening.c, L.opening.baaki]);
  for (const r of L.rows) {
    if (r.kind === 'ob') rows.push([`${fmtDate(r.d)} · Opening baaki`, '', '', '', '', '', '', r.c, r.baaki]);
    else rows.push([fmtDate(r.d), r.t, r.r, r.p, r.k, r.bane, r.m, r.c, r.baaki]);
  }
  const t = L.totals;
  return {
    kind: 'labour',
    title: `Labour Khata - ${labour.name}`,
    subtitle: `${label}${labour.phone ? ` · Phone: ${labour.phone}` : ''}`,
    file: `Khata_${asciiName(labour.name) || 'Labour'}_${period.mode === 'mahina' ? period.ym : period.mode === 'saal' ? period.year : 'poora'}`,
    sections: [{
      columns: [
        col('d', 'Date', { align: 'left', wide: true }),
        col('t', 'Le gaye'), col('r', 'Wapis'), col('p', 'Lage'), col('k', 'Rate', { money: true }),
        col('bane', 'Paisa bane', { money: true }), col('m', 'Mila', { money: true }),
        col('c', 'Cooler baaki'), col('baaki', 'Paisa baaki', { money: true }),
      ],
      rows,
      total: ['Kul', t.t, t.r, t.p, '', t.bane, t.m, t.c, t.baaki],
    }],
  };
}

/** Number ko report ke liye string banata hai */
export function fmtCell(v, column) {
  if (typeof v !== 'number') return v ?? '';
  const s = Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (column?.money) return `${v < 0 ? '-' : ''}₹${s}`;
  return `${v < 0 ? '-' : ''}${s}`;
}
