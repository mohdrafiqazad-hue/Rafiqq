import { describe, it, expect } from 'vitest';
import { parseBackup, planImport, mergeData, buildBackup, safeId } from './backup.js';

const file = {
  app: 'madhur-ganga-cooler',
  v: 1,
  exportedAt: '2026-11-01T10:00:00.000Z',
  rate: 10,
  labours: [
    { id: 'L1', name: 'राम', phone: '9999999999', archived: false },
    { id: 'a/b', name: 'Shyam', phone: '', archived: true },
  ],
  entries: [
    { l: 'L1', d: '2026-10-01', t: 10, r: 2, p: 8, m: 50, k: 10 },
    { l: 'L1', d: '2026-10-01', t: 11, r: 2, p: 9, m: 50, k: 10 }, // duplicate: ye wali rahegi
    { l: 'a/b', d: '2026-10-02', t: 5, r: 5, p: 5, m: 50 }, // k nahi hai: file ka rate
    { l: 'XX', d: '2026-10-02', t: 1 }, // anjaan labour: skip
    { l: 'L1', d: '2026-13-40', t: 1 }, // galat date: skip
  ],
};

describe('parseBackup', () => {
  const data = parseBackup(JSON.stringify(file));
  it('labour aur entries', () => {
    expect(data.labours.map((l) => l.id)).toEqual(['L1', 'a_b']);
    expect(data.labours[1].archived).toBe(true);
    expect(data.entries).toHaveLength(2);
    expect(data.skipped).toBe(2);
    expect(data.rate).toBe(10);
  });
  it('duplicate me baad wali entry, k na ho to file ka rate', () => {
    expect(data.entries.find((e) => e.l === 'L1').t).toBe(11);
    expect(data.entries.find((e) => e.l === 'a_b').k).toBe(10);
  });
  it('galat file par saaf message', () => {
    expect(() => parseBackup('hello')).toThrow(/JSON/);
    expect(() => parseBackup('{"x":1}')).toThrow(/labour/);
    expect(() => parseBackup('{"app":"other","labours":[],"entries":[]}')).toThrow(/doosre app/);
  });
  it('safeId', () => {
    expect(safeId('a/b')).toBe('a_b');
    expect(safeId('..')).toBe('L__');
    expect(safeId('__x__')).toBe('L__x__');
  });
});

describe('planImport / mergeData', () => {
  const incoming = parseBackup(JSON.stringify(file));
  const current = {
    labours: [{ id: 'L1', name: 'Ram (purana naam)', phone: '', archived: false }, { id: 'L9', name: 'Mohan' }],
    entries: [
      { l: 'L1', d: '2026-10-01', t: 99, r: 0, p: 0, m: 0, k: 10 },
      { l: 'L9', d: '2026-10-05', t: 3, r: 0, p: 0, m: 0, k: 10 },
    ],
  };
  it('plan ki ginti', () => {
    expect(planImport(current, incoming)).toMatchObject({
      labourCount: 2, entryCount: 2, newLabours: 1, updatedLabours: 1, newEntries: 1, replacedEntries: 1, skipped: 2,
    });
  });
  it('same labour + date: file wali entry rahe', () => {
    const merged = mergeData(current, incoming);
    expect(merged.labours).toHaveLength(3);
    expect(merged.entries).toHaveLength(3);
    expect(merged.entries.find((e) => e.l === 'L1' && e.d === '2026-10-01').t).toBe(11);
    expect(merged.labours.find((l) => l.id === 'L1').name).toBe('राम');
  });
  it('kharche aur category bhi aate hain', () => {
    const b = buildBackup({
      rate: 10, labours: [], entries: [],
      expenses: [{ id: 'x1', d: '2026-11-01', c: 'diesel', a: 1500, p: 'Pump', n: '' }, { id: 'x2', d: '2026-11-02', c: 'c_b', a: 0 }],
      xcats: [{ id: 'c_b', name: 'Bottle' }],
    });
    const back = parseBackup(JSON.stringify(b));
    expect(back.expenses).toEqual([{ id: 'x1', d: '2026-11-01', c: 'diesel', a: 1500, p: 'Pump', n: '' }]);
    expect(back.skipped).toBe(1);
    expect(back.xcats).toEqual([{ id: 'c_b', name: 'Bottle' }]);
    const plan = planImport({ labours: [], entries: [], expenses: [{ id: 'x1' }] }, back);
    expect(plan).toMatchObject({ expenseCount: 1, newExpenses: 0, replacedExpenses: 1 });
    const merged = mergeData({ labours: [], entries: [], expenses: [{ id: 'x9', d: '2026-01-01', c: 'other', a: 5 }] }, back);
    expect(merged.expenses.map((x) => x.id).sort()).toEqual(['x1', 'x9']);
  });
  it('purani file (bina kharche) bhi chale', () => {
    const back = parseBackup(JSON.stringify(file));
    expect(back.expenses).toEqual([]);
    expect(back.xcats).toEqual([]);
  });
  it('galti ka code', () => {
    try { parseBackup('x'); } catch (e) { expect(e.code).toBe('bk.notjson'); }
  });
  it('backup -> parse -> wahi data', () => {
    const b = buildBackup({
      rate: 12,
      labours: [{ id: 'L1', name: 'X', phone: '', archived: false, o: 0, ob: { d: '2026-01-31', c: 4, m: 40 } }],
      entries: [{ l: 'L1', d: '2026-02-01', t: 1, r: 0, p: 1, m: 0, k: 12 }],
    });
    expect(b.app).toBe('madhur-ganga-cooler');
    const back = parseBackup(JSON.stringify(b));
    expect(back.rate).toBe(12);
    expect(back.labours[0].ob).toEqual({ d: '2026-01-31', c: 4, m: 40 });
    expect(back.entries[0]).toEqual({ l: 'L1', d: '2026-02-01', t: 1, r: 0, p: 1, m: 0, k: 12 });
  });
});
