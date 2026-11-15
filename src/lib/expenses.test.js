import { describe, it, expect } from 'vitest';
import { allCategories, byCategory, catName, expenseSummary, expensesIn, newCatId, totalExpense } from './expenses.js';

const expenses = [
  { id: 'x1', d: '2026-11-01', c: 'diesel', a: 1500, p: 'Petrol pump', n: '16 litre' },
  { id: 'x2', d: '2026-11-03', c: 'driver', a: 500, p: 'Raju', n: '' },
  { id: 'x3', d: '2026-11-03', c: 'diesel', a: 1000.5, p: '', n: '' },
  { id: 'x4', d: '2026-11-30', c: 'salary', a: 8000, p: 'Munim ji', n: '' },
  { id: 'x5', d: '2026-12-01', c: 'c_bottle', a: 300, p: '', n: '' },
];
const entries = [
  { l: 'A', d: '2026-11-01', t: 10, r: 0, p: 10, m: 5000, k: 10 },
  { l: 'A', d: '2026-11-05', t: 10, r: 0, p: 10, m: 7000, k: 10 },
  { l: 'A', d: '2026-12-02', t: 10, r: 0, p: 10, m: 999, k: 10 },
];

describe('kharcha', () => {
  it('period filter aur total', () => {
    const nov = expensesIn(expenses, '2026-11-01', '2026-11-30');
    expect(nov.map((x) => x.id)).toEqual(['x1', 'x2', 'x3', 'x4']);
    expect(totalExpense(nov)).toBe(11000.5);
  });
  it('category-wise (bade se chhote)', () => {
    const nov = expensesIn(expenses, '2026-11-01', '2026-11-30');
    expect(byCategory(nov)).toEqual([
      { id: 'salary', count: 1, total: 8000 },
      { id: 'diesel', count: 2, total: 2500.5 },
      { id: 'driver', count: 1, total: 500 },
    ]);
  });
  it('saar: mila − kharcha = bachat', () => {
    const s = expenseSummary(entries, expenses, '2026-11-01', '2026-11-30');
    expect(s.mila).toBe(12000);
    expect(s.kharcha).toBe(11000.5);
    expect(s.bachat).toBe(999.5);
  });
  it('category ke naam', () => {
    const custom = [{ id: 'c_bottle', name: 'Bottle' }];
    expect(catName('diesel', custom)).toBe('Diesel');
    expect(catName('c_bottle', custom)).toBe('Bottle');
    expect(allCategories(custom).map((c) => c.id)).toContain('c_bottle');
    expect(newCatId('Bottle', custom)).toBe('c_bottle_2');
    expect(newCatId('चाय', [])).toBe('c_x');
  });
});
