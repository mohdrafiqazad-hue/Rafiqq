import { describe, it, expect } from 'vitest';
import { parseVoice, readNumbers, skeleton, matchLabour, tokenize, bestParse } from './voice.js';

const L = [
  { id: 'A', name: 'Naseem' },
  { id: 'B', name: 'Rehman' },
  { id: 'C', name: 'रमेश कुमार' },
  { id: 'D', name: 'Mohan Lal' },
  { id: 'E', name: 'Suresh' },
];
const vals = (r) => Object.fromEntries(Object.entries(r.fields).map(([k, v]) => [k, v.value]));

describe('number words', () => {
  it('alag-alag number', () => {
    expect(readNumbers(['15', '15', '30'])).toEqual([15, 15, 30]);
    expect(readNumbers(['fifteen', 'fifteen', 'thirty'])).toEqual([15, 15, 30]);
    expect(readNumbers(['पंद्रह', 'पंद्रह', 'तीस'])).toEqual([15, 15, 30]);
  });
  it('sau, hazaar, dedh, dhai, saade', () => {
    expect(readNumbers(['paanch', 'sau'])).toEqual([500]);
    expect(readNumbers(['पांच', 'सौ'])).toEqual([500]);
    expect(readNumbers(['do', 'sau', 'pachas'])).toEqual([250]);
    expect(readNumbers(['do', 'hazaar', 'paanch', 'sau'])).toEqual([2500]);
    expect(readNumbers(['2', 'हज़ार', '500'])).toEqual([2500]);
    expect(readNumbers(['dedh', 'sau'])).toEqual([150]);
    expect(readNumbers(['ढाई', 'सौ'])).toEqual([250]);
    expect(readNumbers(['saade', 'teen', 'sau'])).toEqual([350]);
    expect(readNumbers(['twenty', 'five'])).toEqual([25]);
    expect(readNumbers(['five', 'hundred'])).toEqual([500]);
    expect(readNumbers(['ਪੰਜ', 'ਸੌ'])).toEqual([500]);
    expect(readNumbers(['1000', '500'])).toEqual([1000, 500]);
  });
  it('Hindi/Punjabi ank (digits)', () => {
    expect(tokenize('नसीम १५ ले गया')).toEqual(['नसीम', '15', 'ले', 'गया']);
    expect(tokenize('ਨਸੀਮ ੬੦')).toEqual(['ਨਸੀਮ', '60']);
    expect(tokenize('₹1,500 diye')).toEqual(['₹', '1500', 'diye']);
  });
});

describe('naam milana', () => {
  it('likhawat badle to bhi', () => {
    expect(skeleton('Naseem')).toBe(skeleton('नसीम'));
    expect(skeleton('Naseem')).toBe(skeleton('ਨਸੀਮ'));
    expect(skeleton('Rehman')).toBe(skeleton('रहमान'));
    expect(skeleton('Ramesh')).toBe(skeleton('रमेश'));
    expect(skeleton('Rafiq')).toBe(skeleton('रफ़ीक'));
  });
  it('labour chunna', () => {
    expect(matchLabour(['नसीम'], L).id).toBe('A');
    expect(matchLabour(['nasim'], L).id).toBe('A');
    expect(matchLabour(['ramesh'], L).id).toBe('C');
    expect(matchLabour(['mohan'], L).id).toBe('D');
    expect(matchLabour(['ਸੁਰੇਸ਼'], L).id).toBe('E');
    expect(matchLabour(['kaleem'], L)).toBe(null);
  });
  it('do barabar mile to pakka nahi (null)', () => {
    expect(matchLabour(['raju'], [{ id: 1, name: 'Raju' }, { id: 2, name: 'Raju' }])).toBe(null);
  });
});

describe('poori line', () => {
  const cases = [
    ['Naseem 15 15 30 leke gaya, 50 lage, 10 wapis aaye, 500 rupaye diye', 'A', { t: 60, p: 50, r: 10, m: 500 }],
    ['नसीम पंद्रह पंद्रह तीस ले गया पचास लगे दस वापस आए पांच सौ रुपये दिए', 'A', { t: 60, p: 50, r: 10, m: 500 }],
    ['नसीम 15 15 30 लेकर गया', 'A', { t: 60 }],
    ['Naseem took 60 returned 10 placed 50 paid 500', 'A', { t: 60, r: 10, p: 50, m: 500 }],
    ['Naseem took 60 and paid 500 rupees', 'A', { t: 60, m: 500 }],
    ['ਨਸੀਮ 60 ਲੈ ਗਿਆ 10 ਵਾਪਸ 500 ਰੁਪਏ ਦਿੱਤੇ', 'A', { t: 60, r: 10, m: 500 }],
    ['रहमान ने 40 कूलर लिए 5 वापस आए 35 लगे 350 रुपये जमा किए', 'B', { t: 40, r: 5, p: 35, m: 350 }],
    ['Mohan wapis 10 lage 50 le gaya 60 paise 500', 'D', { r: 10, p: 50, t: 60, m: 500 }],
    ['Naseem 60 le gaya ₹500', 'A', { t: 60, m: 500 }],
    ['Naseem 60 le gaya 500 rupaye 10 wapis', 'A', { t: 60, m: 500, r: 10 }],
    ['rehman do sau pachas rupaye diye 20 le gaya', 'B', { m: 250, t: 20 }],
    ['Ramesh 60 10 50 500', 'C', { t: 60, r: 10, p: 50, m: 500 }],
    ['Naseem le gaya 60', 'A', { t: 60 }],
  ];
  for (const [text, id, expected] of cases) {
    it(text, () => {
      const r = parseVoice(text, L);
      expect(r.labour?.id).toBe(id);
      expect(vals(r)).toEqual(expected);
      expect(r.leftover).toEqual([]);
    });
  }
  it('15 + 15 + 30 ke hisse yaad rahein', () => {
    expect(parseVoice('Naseem 15 15 30 le gaya', L).fields.t.parts).toEqual([15, 15, 30]);
  });
  it('naam na bole to labour null, number phir bhi', () => {
    const r = parseVoice('60 le gaya 500 diye', L);
    expect(r.labour).toBe(null);
    expect(vals(r)).toEqual({ t: 60, m: 500 });
  });
  it('kai alternatives me se naam wala chune', () => {
    const r = bestParse(['nasir 60 le gaya', 'naseem 60 le gaya'], L);
    expect(r.labour.id).toBe('A');
    expect(r.text).toBe('naseem 60 le gaya');
  });
});
