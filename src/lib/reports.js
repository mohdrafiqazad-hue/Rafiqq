// Report ka "model" banata hai: title + sections (columns, rows, total).
// Isi model se screen par table, PDF, Word aur Excel teeno bante hain.
// Row ke cells: number (formatting baad me hoti hai) ya string.
// Saare words chuni hui bhasha (t()) me aate hain.

import { dayReport, periodReport, yearByMonth, ledger, money } from './calc.js';
import { addDays, fmtDate, fmtDateLong, fmtDayShort, fmtMonth, fmtWeek, monthStart, monthEnd, weekEnd } from './dates.js';
import { t } from '../i18n/index.js';
import { ln, nameIn } from './translit.js';
import { catName, expenseSummary } from './expenses.js';

export const COMPANY = 'Madhur Ganga Minerals';

/** File ke naam ke liye sirf English letters/numbers (kai phones Hindi file-naam theek se nahi lete) */
export const asciiName = (s) => String(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

/** w = PDF me column ki chaudai ka hissa (wide = 3) */
const col = (key, label, opts = {}) => ({ key, label, align: 'right', ...opts });
const wideCol = (key, label) => col(key, label, { align: 'left', wide: true });

const ACT_KEYS = ['t', 'r', 'p', 'bane', 'm', 'c', 'baaki'];
const activityCols = () => [
  col('t', t('col.t')),
  col('r', t('col.r')),
  col('p', t('col.p')),
  col('bane', t('col.bane'), { money: true }),
  col('m', t('col.m'), { money: true }),
  col('c', t('col.c')),
  col('baaki', t('col.baaki'), { money: true }),
];

const totalRow = (tot, keys) => [t('c.total'), ...keys.map((k) => tot[k])];

export function buildDayReport(labours, entries, date) {
  const d = dayReport(labours, entries, date);
  const done = d.rows.filter((r) => r.entry).length;
  return {
    kind: 'din',
    title: t('rep.dayTitle', { date: fmtDate(date) }),
    subtitle: t('rep.daySub', { day: fmtDateLong(date), done, n: d.rows.length }),
    file: `Roz_${date}`,
    sections: [{
      columns: [wideCol('name', t('col.labour')), ...activityCols()],
      rows: d.rows.map((r) => (r.entry
        ? [ln(r.labour), r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]
        : [t('rep.noEntry', { name: ln(r.labour) }), '-', '-', '-', '-', '-', r.c, r.baaki])),
      total: totalRow(d.totals, ACT_KEYS),
    }],
  };
}

function labourPeriodSection(labours, entries, from, to, heading) {
  const p = periodReport(labours, entries, from, to);
  return {
    heading,
    columns: [wideCol('name', t('col.labour')), col('days', t('col.days')), ...activityCols()],
    rows: p.rows.map((r) => [ln(r.labour) + (r.labour.archived ? t('c.archivedSuffix') : ''), r.days, r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]),
    rowIds: p.rows.map((r) => r.labour.id), // screen par naam dabakar record kholne ke liye
    total: [t('c.total'), p.rows.reduce((s, r) => s + r.days, 0), ...ACT_KEYS.map((k) => p.totals[k])],
  };
}

export function buildMonthReport(labours, entries, ym) {
  return {
    kind: 'mahina',
    title: t('rep.monthTitle', { month: fmtMonth(ym) }),
    subtitle: t('rep.monthSub', { from: fmtDate(monthStart(ym)), to: fmtDate(monthEnd(ym)) }),
    file: `Mahina_${ym}`,
    sections: [labourPeriodSection(labours, entries, monthStart(ym), monthEnd(ym))],
  };
}

/** Hafte ki report: labour-wise + din-wise (Somvar se Ravivar) */
export function buildWeekReport(labours, entries, ws) {
  const we = weekEnd(ws);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i);
    days.push({ d, ...periodReport(labours, entries, d, d).totals });
  }
  const sum = (k) => days.reduce((s, r) => money(s + r[k]), 0);
  const last = days[days.length - 1];
  return {
    kind: 'hafta',
    title: t('rep.weekTitle', { label: fmtWeek(ws) }),
    subtitle: t('rep.weekSub'),
    file: `Hafta_${ws}`,
    sections: [
      labourPeriodSection(labours, entries, ws, we, t('rep.labourWise')),
      {
        heading: t('rep.dayWise'),
        columns: [wideCol('day', t('col.date')), ...activityCols()],
        rows: days.map((r) => [fmtDayShort(r.d), r.t, r.r, r.p, r.bane, r.m, r.c, r.baaki]),
        total: [t('c.total'), sum('t'), sum('r'), sum('p'), sum('bane'), sum('m'), last.c, last.baaki],
      },
    ],
  };
}

export function buildYearReport(labours, entries, year, expenses = []) {
  const y = yearByMonth(labours, entries, year);
  const xByMonth = new Map();
  for (const x of expenses) {
    if (x.d.startsWith(`${year}-`)) xByMonth.set(x.d.slice(0, 7), money((xByMonth.get(x.d.slice(0, 7)) || 0) + Number(x.a || 0)));
  }
  const xTotal = [...xByMonth.values()].reduce((s, v) => money(s + v), 0);
  const cols = activityCols();
  cols.splice(5, 0, col('x', t('col.kharcha'), { money: true }));
  return {
    kind: 'saal',
    title: t('rep.yearTitle', { year }),
    subtitle: t('rep.yearSub'),
    file: `Saal_${year}`,
    sections: [
      {
        heading: t('rep.monthWise'),
        columns: [wideCol('month', t('col.month')), ...cols],
        rows: y.rows.map((r) => [fmtMonth(r.ym), r.t, r.r, r.p, r.bane, r.m, xByMonth.get(r.ym) || 0, r.c, r.baaki]),
        total: [t('c.total'), y.totals.t, y.totals.r, y.totals.p, y.totals.bane, y.totals.m, xTotal, y.totals.c, y.totals.baaki],
      },
      labourPeriodSection(labours, entries, `${year}-01-01`, `${year}-12-31`, t('rep.labourWise')),
    ],
  };
}

/** period: { mode: 'mahina'|'saal'|'poora', ym?, year? } */
export function periodRange(period) {
  if (period.mode === 'hafta') return { from: period.ws, to: weekEnd(period.ws), label: fmtWeek(period.ws) };
  if (period.mode === 'mahina') return { from: monthStart(period.ym), to: monthEnd(period.ym), label: fmtMonth(period.ym) };
  if (period.mode === 'saal') return { from: `${period.year}-01-01`, to: `${period.year}-12-31`, label: String(period.year) };
  return { from: null, to: null, label: t('rep.fullHisab') };
}

const periodFile = (period) => (period.mode === 'hafta' ? `hafta_${period.ws}`
  : period.mode === 'mahina' ? period.ym : period.mode === 'saal' ? period.year : 'poora');

export function buildLabourReport(labour, entries, period) {
  const { from, to, label } = periodRange(period);
  const L = ledger(labour, entries, from, to);
  const rows = [];
  rows.push([from ? t('rep.pichla') : t('rep.start'), '', '', '', '', '', '', L.opening.c, L.opening.baaki]);
  for (const r of L.rows) {
    if (r.kind === 'ob') rows.push([t('rep.opening', { date: fmtDate(r.d) }), '', '', '', '', '', '', r.c, r.baaki]);
    else rows.push([fmtDate(r.d), r.t, r.r, r.p, r.k, r.bane, r.m, r.c, r.baaki]);
  }
  const tot = L.totals;
  return {
    kind: 'labour',
    title: t('rep.khataTitle', { name: ln(labour) }),
    subtitle: `${label}${labour.phone ? ` · ${t('c.phone')}: ${labour.phone}` : ''}`,
    file: `Khata_${asciiName(nameIn(labour, 'en')) || 'Labour'}_${periodFile(period)}`,
    sections: [{
      columns: [
        wideCol('d', t('col.date')),
        col('t', t('col.t')), col('r', t('col.r')), col('p', t('col.p')), col('k', t('col.rate'), { money: true }),
        col('bane', t('col.bane'), { money: true }), col('m', t('col.m'), { money: true }),
        col('c', t('col.c')), col('baaki', t('col.baaki'), { money: true }),
      ],
      rows,
      total: [t('c.total'), tot.t, tot.r, tot.p, '', tot.bane, tot.m, tot.c, tot.baaki],
    }],
  };
}

/** Kharcha report: saar, category-wise, poori list */
export function buildExpenseReport(entries, expenses, xcats, period) {
  const { from, to, label } = periodRange(period);
  const s = expenseSummary(entries, expenses, from, to);
  const first = from || s.list[0]?.d;
  const last = to || s.list[s.list.length - 1]?.d;
  return {
    kind: 'kharcha',
    title: t('rep.xTitle', { label }),
    subtitle: first ? t('rep.xSub', { from: fmtDate(first), to: fmtDate(last) }) : '',
    file: `Kharcha_${periodFile(period)}`,
    sections: [
      {
        heading: t('rep.xSummary'),
        columns: [col('item', t('col.item'), { align: 'left', w: 3 }), col('a', t('col.amount'), { money: true, w: 1.5 })],
        rows: [
          [t('rep.xMila'), s.mila],
          [t('rep.xKul'), s.kharcha],
        ],
        total: [t('rep.xBachat'), s.bachat],
      },
      {
        heading: t('rep.xByCat'),
        columns: [col('c', t('col.category'), { align: 'left', w: 3 }), col('n', t('col.count'), { w: 1 }), col('a', t('col.amount'), { money: true, w: 1.5 })],
        rows: s.cats.map((c) => [catName(c.id, xcats), c.count, c.total]),
        total: [t('c.total'), s.list.length, s.kharcha],
      },
      {
        heading: t('rep.xList'),
        columns: [
          col('d', t('col.date'), { align: 'left', w: 1.3 }),
          col('c', t('col.category'), { align: 'left', w: 1.8 }),
          col('p', t('col.detail'), { align: 'left', w: 2.6 }),
          col('a', t('col.amount'), { money: true, w: 1.2 }),
        ],
        rows: s.list.map((x) => [fmtDate(x.d), catName(x.c, xcats), [x.p, x.n].filter(Boolean).join(' · '), Number(x.a) || 0]),
        total: [t('c.total'), '', '', s.kharcha],
      },
    ],
  };
}

/** Number ko report ke liye string banata hai */
export function fmtCell(v, column) {
  if (typeof v !== 'number') return v ?? '';
  const s = Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (column?.money) return `${v < 0 ? '-' : ''}₹${s}`;
  return `${v < 0 ? '-' : ''}${s}`;
}
