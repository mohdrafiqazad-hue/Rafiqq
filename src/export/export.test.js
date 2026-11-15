import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildDayReport, buildMonthReport, buildYearReport, buildLabourReport } from '../lib/reports.js';
import { reportToPdf, splitRuns } from './pdf.js';
import { reportToDocx } from './docx.js';
import { reportToXlsx } from './xlsx.js';

const labours = [
  { id: 'A', name: 'रमेश कुमार', phone: '9876543210', archived: false, o: 0 },
  { id: 'B', name: 'Suresh Yadav', phone: '', archived: false, o: 1, ob: { d: '2026-10-31', c: 5, m: 200 } },
];
const entries = [
  { l: 'A', d: '2026-11-01', t: 20, r: 5, p: 12, m: 100, k: 10 },
  { l: 'A', d: '2026-11-02', t: 10, r: 12, p: 8, m: 150, k: 10 },
  { l: 'B', d: '2026-11-01', t: 10, r: 3, p: 6, m: 50, k: 10 },
];

beforeAll(() => {
  // PDF fonts ko disk se padhne ke liye fetch ka nakli version
  globalThis.fetch = async (url) => {
    const file = path.resolve('public', String(url).replace(/^\//, ''));
    const buf = fs.readFileSync(file);
    return { ok: true, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  };
});

describe('splitRuns', () => {
  it('Hindi aur English alag tukde', () => {
    expect(splitRuns('रमेश Kumar 12')).toEqual([
      { text: 'रमेश ', latin: false },
      { text: 'Kumar 12', latin: true },
    ]);
  });
});

describe('reports', () => {
  it('day report total row', () => {
    const r = buildDayReport(labours, entries, '2026-11-01');
    expect(r.sections[0].rows).toHaveLength(2);
    expect(r.sections[0].total).toEqual(['Kul', 30, 8, 18, 180, 150, 27, 230]);
  });
  it('labour report starts with pichla baaki', () => {
    const r = buildLabourReport(labours[1], entries, { mode: 'mahina', ym: '2026-11' });
    expect(r.sections[0].rows[0].slice(-2)).toEqual([5, 200]);
  });
});

describe('files', () => {
  const out = process.env.EXPORT_OUT;
  const reports = [
    buildMonthReport(labours, entries, '2026-11'),
    buildYearReport(labours, entries, 2026),
    buildLabourReport(labours[0], entries, { mode: 'poora' }),
  ];
  it('PDF bane', async () => {
    for (const r of reports) {
      const blob = await reportToPdf(r);
      const buf = Buffer.from(await blob.arrayBuffer());
      expect(buf.slice(0, 5).toString()).toBe('%PDF-');
      if (out) fs.writeFileSync(path.join(out, `${r.file}.pdf`), buf);
    }
  });
  it('Word bane', async () => {
    const blob = await reportToDocx(reports[1]);
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.slice(0, 2).toString()).toBe('PK');
    if (out) fs.writeFileSync(path.join(out, 'saal.docx'), buf);
  });
  it('Excel bane', async () => {
    const blob = await reportToXlsx(reports[1]);
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.slice(0, 2).toString()).toBe('PK');
    if (out) fs.writeFileSync(path.join(out, 'saal.xlsx'), buf);
  });
});
