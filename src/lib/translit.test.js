import { describe, it, expect, afterEach } from 'vitest';
import { toDevanagari, toLatin, nameIn, ln } from './translit.js';
import { setLang } from '../i18n/index.js';
import { buildBackup, parseBackup } from './backup.js';

describe('naam ki likhawat', () => {
  afterEach(() => setLang('hl'));
  it('English -> Hindi', () => {
    const cases = {
      Naseem: 'नसीम', Rehman: 'रहमान', 'Mohan Lal': 'मोहन लाल', Suresh: 'सुरेश', 'Ramesh Kumar': 'रमेश कुमार',
      Kaleem: 'कलीम', Imran: 'इमरान', Pradeep: 'प्रदीप', Shyam: 'श्याम', Ganga: 'गंगा', Ali: 'अली',
      'Mohammad Kaleem': 'मोहम्मद कलीम', Mehmood: 'महमूद', Deepak: 'दीपक', Vijay: 'विजय',
    };
    for (const [en, hi] of Object.entries(cases)) expect(toDevanagari(en)).toBe(hi);
  });
  it('Hindi -> English', () => {
    expect(toLatin('रमेश कुमार')).toBe('Ramesh Kumar');
    expect(toLatin('नसीम')).toBe('Naseem');
    expect(toLatin('मोहन लाल')).toBe('Mohan Lal');
    expect(toLatin('सलमान')).toBe('Salman');
    expect(toLatin('कमला')).toBe('Kamla');
  });
  it('bhasha ke hisab se naam; malik ka likha naam pehle', () => {
    expect(nameIn({ name: 'Naseem' }, 'hi')).toBe('नसीम');
    expect(nameIn({ name: 'Naseem' }, 'hl')).toBe('Naseem');
    expect(nameIn({ name: 'Naseem' }, 'en')).toBe('Naseem');
    expect(nameIn({ name: 'रमेश कुमार' }, 'en')).toBe('Ramesh Kumar');
    expect(nameIn({ name: 'रमेश कुमार' }, 'hi')).toBe('रमेश कुमार');
    expect(nameIn({ name: 'Bilal', nameHi: 'बिलाल भाई' }, 'hi')).toBe('बिलाल भाई');
    expect(nameIn({ name: 'रमेश', nameEn: 'Ramesh Ji' }, 'en')).toBe('Ramesh Ji');
    setLang('hi');
    expect(ln({ name: 'Rehman' })).toBe('रहमान');
  });
  it('backup me Hindi/English naam bhi jaye aur aaye', () => {
    const b = buildBackup({ rate: 10, labours: [{ id: 'A', name: 'Bilal', nameHi: 'बिलाल', phone: '', archived: false }], entries: [] });
    expect(b.labours[0].nameHi).toBe('बिलाल');
    expect(parseBackup(JSON.stringify(b)).labours[0].nameHi).toBe('बिलाल');
  });
});
