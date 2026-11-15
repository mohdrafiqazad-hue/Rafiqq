import { describe, it, expect } from 'vitest';
import {
  bane, balanceAt, balanceBefore, groupByLabour, parchi, nextPendingLabour,
  dayReport, periodReport, yearByMonth, ledger, money, fmtRs,
} from './calc.js';

// ---- Sample data (rate ₹10, December me rate ₹12) ----
const A = { id: 'A', name: 'Ramesh', phone: '', archived: false, o: 0 };
const B = { id: 'B', name: 'सुरेश', phone: '9876543210', archived: false, o: 1, ob: { d: '2026-10-31', c: 5, m: 200 } };
const C = { id: 'C', name: 'Purana Labour', phone: '', archived: true, o: 2 };
const labours = [C, B, A];

const entries = [
  { l: 'A', d: '2026-11-01', t: 20, r: 5, p: 12, m: 100, k: 10 },
  { l: 'A', d: '2026-11-02', t: 10, r: 12, p: 8, m: 150, k: 10 },
  { l: 'A', d: '2026-12-01', t: 5, r: 0, p: 5, m: 0, k: 12 },
  { l: 'B', d: '2026-10-30', t: 100, r: 0, p: 100, m: 0, k: 10 },
  { l: 'B', d: '2026-11-01', t: 10, r: 3, p: 6, m: 50, k: 10 },
  { l: 'C', d: '2026-11-02', t: 4, r: 4, p: 4, m: 40, k: 10 },
];
const byL = groupByLabour(entries);

describe('basic formulas', () => {
  it('paisa bane = p × k', () => {
    expect(bane({ p: 12, k: 10 })).toBe(120);
    expect(bane({ p: 3, k: 0.1 })).toBe(0.3);
  });
  it('money rounding', () => {
    expect(money(0.1 + 0.2)).toBe(0.3);
  });
  it('rupaye format', () => {
    expect(fmtRs(1250)).toBe('₹1,250');
    expect(fmtRs(-50)).toBe('-₹50');
    expect(fmtRs(125000)).toBe('₹1,25,000');
  });
});

describe('balanceAt / balanceBefore', () => {
  it('labour A ka baaki', () => {
    expect(balanceAt(A, byL.get('A'), '2026-10-31')).toEqual({ c: 0, m: 0 });
    expect(balanceAt(A, byL.get('A'), '2026-11-01')).toEqual({ c: 15, m: 20 });
    expect(balanceAt(A, byL.get('A'), '2026-11-02')).toEqual({ c: 13, m: -50 });
    expect(balanceAt(A, byL.get('A'), '2026-12-31')).toEqual({ c: 18, m: 10 });
    expect(balanceBefore(A, byL.get('A'), '2026-11-02')).toEqual({ c: 15, m: 20 });
  });
  it('opening balance: us date ke baad baaki opening se shuru hota hai', () => {
    expect(balanceAt(B, byL.get('B'), '2026-10-30')).toEqual({ c: 100, m: 1000 });
    expect(balanceAt(B, byL.get('B'), '2026-10-31')).toEqual({ c: 5, m: 200 });
    expect(balanceAt(B, byL.get('B'), '2026-11-01')).toEqual({ c: 12, m: 210 });
    expect(balanceBefore(B, byL.get('B'), '2026-11-01')).toEqual({ c: 5, m: 200 });
  });
  it('purana rate entry ke saath rehta hai (k)', () => {
    // December wali entry k=12 se bani, baaki entries k=10 se
    expect(balanceAt(A, byL.get('A'), '2026-12-01').m).toBe(-50 + 60);
  });
});

describe('parchi (Entry screen)', () => {
  it('live hisab', () => {
    const p = parchi({ c: 15, m: 20 }, { t: '10', r: '12', p: '8', m: '150' }, 10);
    expect(p.coolerBaaki).toBe(13);
    expect(p.paisaBane).toBe(80);
    expect(p.kulPaisaBaaki).toBe(-50);
    expect(p.tooManyReturned).toBe(false);
  });
  it('khaali input = 0', () => {
    const p = parchi({ c: 3, m: 5 }, { t: '', r: '', p: '', m: '' }, 10);
    expect(p.coolerBaaki).toBe(3);
    expect(p.kulPaisaBaaki).toBe(5);
  });
  it('wapis aaye zyada ho to warning', () => {
    expect(parchi({ c: 15, m: 0 }, { t: 10, r: 26 }, 10).tooManyReturned).toBe(true);
    expect(parchi({ c: 15, m: 0 }, { t: 10, r: 25 }, 10).tooManyReturned).toBe(false);
  });
});

describe('nextPendingLabour', () => {
  const L = [
    { id: 'A', name: 'a', o: 0 },
    { id: 'B', name: 'b', o: 1 },
    { id: 'D', name: 'd', o: 2 },
  ];
  it('agla bacha hua labour', () => {
    expect(nextPendingLabour(L, new Set(['A']), 'A')).toBe('B');
    expect(nextPendingLabour(L, new Set(['A', 'B']), 'B')).toBe('D');
    expect(nextPendingLabour(L, new Set(['B', 'D']), 'D')).toBe('A');
  });
  it('sab ho gaye to null', () => {
    expect(nextPendingLabour(L, new Set(['A', 'B', 'D']), 'D')).toBe(null);
  });
});

describe('dayReport (Roz)', () => {
  const r = dayReport(labours, entries, '2026-11-02');
  it('order aur archived labour', () => {
    expect(r.rows.map((x) => x.labour.id)).toEqual(['A', 'B', 'C']);
    expect(dayReport(labours, entries, '2026-11-03').rows.map((x) => x.labour.id)).toEqual(['A', 'B']);
  });
  it('labour A', () => {
    const a = r.rows[0];
    expect(a).toMatchObject({ t: 10, r: 12, p: 8, bane: 80, m: 150, prevC: 15, prevM: 20, c: 13, baaki: -50 });
  });
  it('entry nahi hui wala labour', () => {
    expect(r.rows[1].entry).toBe(null);
    expect(r.rows[1]).toMatchObject({ t: 0, c: 12, baaki: 210 });
  });
  it('din ka total', () => {
    expect(r.totals).toEqual({ t: 14, r: 16, p: 12, bane: 120, m: 190, c: 25, baaki: 160 });
  });
});

describe('periodReport (Mahina)', () => {
  it('November: activity sirf mahine ki, baaki shuru se', () => {
    const r = periodReport(labours, entries, '2026-11-01', '2026-11-30');
    expect(r.rows.map((x) => x.labour.id)).toEqual(['A', 'B', 'C']);
    expect(r.rows[0]).toMatchObject({ t: 30, r: 17, p: 20, bane: 200, m: 250, c: 13, baaki: -50, prevC: 0, prevM: 0 });
    expect(r.rows[1]).toMatchObject({ t: 10, r: 3, p: 6, bane: 60, m: 50, c: 12, baaki: 210, prevC: 5, prevM: 200 });
    expect(r.totals).toEqual({ t: 44, r: 24, p: 30, bane: 300, m: 340, c: 25, baaki: 160 });
  });
  it('December: bina activity wala active labour bhi dikhe, archived (0 baaki) na dikhe', () => {
    const r = periodReport(labours, entries, '2026-12-01', '2026-12-31');
    expect(r.rows.map((x) => x.labour.id)).toEqual(['A', 'B']);
    expect(r.rows[1]).toMatchObject({ t: 0, bane: 0, c: 12, baaki: 210 });
    expect(r.totals).toMatchObject({ t: 5, bane: 60, c: 30, baaki: 220 });
  });
});

describe('yearByMonth (Saal)', () => {
  const y = yearByMonth(labours, entries, 2026);
  it('12 mahine', () => {
    expect(y.rows).toHaveLength(12);
    expect(y.rows[0]).toMatchObject({ ym: '2026-01', t: 0, c: 0, baaki: 0 });
  });
  it('har mahine ka running baaki', () => {
    expect(y.rows[9]).toMatchObject({ ym: '2026-10', t: 100, bane: 1000, c: 5, baaki: 200 });
    expect(y.rows[10]).toMatchObject({ ym: '2026-11', t: 44, bane: 300, m: 340, c: 25, baaki: 160 });
    expect(y.rows[11]).toMatchObject({ ym: '2026-12', t: 5, bane: 60, c: 30, baaki: 220 });
  });
  it('saal ka total', () => {
    expect(y.totals).toEqual({ t: 149, r: 24, p: 135, bane: 1360, m: 340, c: 30, baaki: 220 });
  });
});

describe('ledger (Labour khata)', () => {
  it('poora khata', () => {
    const L = ledger(A, entries);
    expect(L.opening).toMatchObject({ c: 0, baaki: 0 });
    expect(L.rows.map((r) => [r.d, r.c, r.baaki])).toEqual([
      ['2026-11-01', 15, 20],
      ['2026-11-02', 13, -50],
      ['2026-12-01', 18, 10],
    ]);
    expect(L.totals).toEqual({ t: 35, r: 17, p: 25, bane: 260, m: 250, c: 18, baaki: 10 });
  });
  it('opening balance row', () => {
    const L = ledger(B, entries);
    expect(L.rows.map((r) => [r.kind, r.d, r.c, r.baaki])).toEqual([
      ['entry', '2026-10-30', 100, 1000],
      ['ob', '2026-10-31', 5, 200],
      ['entry', '2026-11-01', 12, 210],
    ]);
  });
  it('period ke saath pichla baaki', () => {
    const L = ledger(B, entries, '2026-11-01', '2026-11-30');
    expect(L.opening).toMatchObject({ c: 5, baaki: 200 });
    expect(L.rows).toHaveLength(1);
    expect(L.totals).toMatchObject({ t: 10, bane: 60, c: 12, baaki: 210 });
    const D = ledger(A, entries, '2026-12-01', '2026-12-31');
    expect(D.opening).toMatchObject({ c: 13, baaki: -50 });
    expect(D.totals).toMatchObject({ c: 18, baaki: 10 });
  });
  it('khaali period me baaki wahi rahe', () => {
    const L = ledger(A, entries, '2027-01-01', '2027-01-31');
    expect(L.rows).toHaveLength(0);
    expect(L.totals).toMatchObject({ t: 0, c: 18, baaki: 10 });
  });
  it('khata ka aakhri baaki = balanceAt', () => {
    for (const lab of [A, B]) {
      const L = ledger(lab, entries);
      expect({ c: L.totals.c, m: L.totals.baaki }).toEqual(balanceAt(lab, byL.get(lab.id), '2099-12-31'));
    }
  });
});
