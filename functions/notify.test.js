import { describe, it, expect } from 'vitest';
import { balanceAt as fnBalance, buildMessage, newEntries, requestBody, sendWhatsApp, toWaNumber } from './notify.js';
import { balanceAt as appBalance, groupByLabour } from '../src/lib/calc.js';

const labour = { id: 'A', name: 'Naseem', ob: { d: '2026-10-31', c: 5, m: 200 } };
const entries = [
  { l: 'A', d: '2026-10-30', t: 100, r: 0, p: 100, m: 0, k: 10 },
  { l: 'A', d: '2026-11-01', t: 20, r: 5, p: 12, m: 100, k: 10 },
  { l: 'A', d: '2026-11-02', t: 10, r: 12, p: 8, m: 150, k: 12, by: 'Kaleem', byRole: 'manager' },
  { l: 'B', d: '2026-11-02', t: 99, r: 0, p: 0, m: 0, k: 10 },
];

describe('WhatsApp alert', () => {
  it('sirf nayi entries', () => {
    const before = { A_1: entries[0] };
    const after = { A_1: { ...entries[0], t: 1 }, A_2: entries[1] };
    expect(newEntries(before, after)).toEqual([entries[1]]);
    expect(newEntries({}, {})).toEqual([]);
  });
  it('baaki ka hisab app jaisa hi', () => {
    const list = groupByLabour(entries).get('A');
    for (const d of ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-12-31']) {
      expect(fnBalance(labour, entries, d)).toEqual(appBalance(labour, list, d));
    }
  });
  it('message ke 10 hisse', () => {
    const { params, text } = buildMessage(labour, entries, entries[2]);
    // 5 + (20-5) + (10-12) = 18 ; 200 + (120-100) + (96-150) = 166
    expect(params).toEqual(['Naseem', '2 Nov 2026', '10', '12', '18', '8', '96', '150', '166', 'Kaleem (manager)']);
    expect(text).toContain('Pichla baaki: 20 cooler');
    expect(text).toContain('Market me baaki: *18 cooler*');
  });
  it('number aur request body', () => {
    expect(toWaNumber('98765 43210')).toBe('919876543210');
    const msg = buildMessage(labour, entries, entries[1]);
    const tpl = requestBody({ ownerPhone: '9876543210', template: 'entry_alert', lang: 'en' }, msg);
    expect(tpl.type).toBe('template');
    expect(tpl.template.components[0].parameters).toHaveLength(10);
    const txt = requestBody({ ownerPhone: '9876543210' }, msg);
    expect(txt.type).toBe('text');
  });
  it('API galti ka saaf message', async () => {
    const fake = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid OAuth access token', code: 190 } }) });
    await expect(sendWhatsApp({ phoneNumberId: '1', token: 'x', ownerPhone: '9876543210' }, { params: [], text: 'x' }, { fetchImpl: fake }))
      .rejects.toThrow(/401.*Invalid OAuth.*190/);
    await expect(sendWhatsApp({}, { params: [], text: 'x' })).rejects.toThrow(/adhoori/);
  });
});
