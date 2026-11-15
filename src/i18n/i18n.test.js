import { describe, it, expect, afterEach } from 'vitest';
import { STRINGS } from './strings.js';
import { t, setLang } from './index.js';
import { fmtDate, fmtMonth } from '../lib/dates.js';
import fs from 'node:fs';
import path from 'node:path';

const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('teeno bhasha', () => {
  afterEach(() => setLang('hl'));
  it('har key me Hinglish, English, Hindi teeno hain aur {vars} same hain', () => {
    for (const [key, row] of Object.entries(STRINGS)) {
      expect(row, key).toHaveLength(3);
      row.forEach((s) => expect(typeof s === 'string' && s.length > 0, key).toBe(true));
      expect(vars(row[1]), `${key} en`).toEqual(vars(row[0]));
      expect(vars(row[2]), `${key} hi`).toEqual(vars(row[0]));
    }
  });
  it('code me use hui har key strings me hai', () => {
    const files = [];
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(jsx?|tsx?)$/.test(f.name) && !f.name.includes('.test.')) files.push(p);
    });
    walk('src');
    const missing = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\('([a-zA-Z]+\.[\w.]+)'/g)) if (!STRINGS[m[1]]) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
  it('bhasha badalne par words aur dates badalte hain', () => {
    expect(t('tab.kharcha')).toBe('Kharcha');
    setLang('en');
    expect(t('tab.kharcha')).toBe('Expenses');
    expect(fmtMonth('2026-11')).toBe('November 2026');
    setLang('hi');
    expect(t('tab.kharcha')).toBe('खर्चा');
    expect(fmtDate('2026-11-15')).toBe('15 नव 2026');
    expect(t('msg.labourAdded', { name: 'राम' })).toBe('राम जुड़ गया ✓');
  });
});
