// Naam ki likhawat badalna: English (Roman) <-> हिंदी (Devanagari).
// Sirf DIKHANE ke liye; save hua naam nahi badalta. Malik form me sahi Hindi/English naam khud bhi likh sakta hai.

// Aam naamon ki sahi spelling (pehle yahan dekhte hain, phir niyam)
const NAMES = {
  kumar: 'कुमार', kumari: 'कुमारी', lal: 'लाल', ram: 'राम', khan: 'ख़ान', singh: 'सिंह', shah: 'शाह', devi: 'देवी',
  mohammad: 'मोहम्मद', mohammed: 'मोहम्मद', muhammad: 'मुहम्मद', mohd: 'मोहम्मद', md: 'मोहम्मद', ahmad: 'अहमद', ahmed: 'अहमद',
  ali: 'अली', rehman: 'रहमान', rahman: 'रहमान', imran: 'इमरान', salman: 'सलमान', farhan: 'फ़रहान', rafiq: 'रफ़ीक', rafeeq: 'रफ़ीक',
  kaleem: 'कलीम', kalim: 'कलीम', shakeel: 'शकील', shakil: 'शकील', anwar: 'अनवर', irfan: 'इरफ़ान', arif: 'आरिफ़', azad: 'आज़ाद',
  naseem: 'नसीम', nasim: 'नसीम', nadeem: 'नदीम', waseem: 'वसीम', wasim: 'वसीम', saleem: 'सलीम', salim: 'सलीम', aslam: 'असलम',
  asif: 'आसिफ़', sajid: 'साजिद', zahid: 'ज़ाहिद', rashid: 'राशिद', javed: 'जावेद', iqbal: 'इक़बाल', akbar: 'अकबर', hasan: 'हसन',
  hussain: 'हुसैन', husain: 'हुसैन', sohail: 'सोहैल', faizan: 'फ़ैज़ान', raees: 'रईस', rais: 'रईस', shahid: 'शाहिद', sameer: 'समीर',
  rakesh: 'राकेश', rajesh: 'राजेश', mukesh: 'मुकेश', dinesh: 'दिनेश', ramesh: 'रमेश', suresh: 'सुरेश', mahesh: 'महेश', ganesh: 'गणेश',
  santosh: 'संतोष', sanjay: 'संजय', ajay: 'अजय', vijay: 'विजय', sunil: 'सुनील', anil: 'अनिल', amit: 'अमित', rahul: 'राहुल',
  rohit: 'रोहित', deepak: 'दीपक', pradeep: 'प्रदीप', sandeep: 'संदीप', kuldeep: 'कुलदीप', manoj: 'मनोज', pankaj: 'पंकज',
  raju: 'राजू', babu: 'बाबू', bhai: 'भाई', chand: 'चंद', nath: 'नाथ', das: 'दास', pal: 'पाल', sahu: 'साहू', prasad: 'प्रसाद',
  yadav: 'यादव', sharma: 'शर्मा', gupta: 'गुप्ता', verma: 'वर्मा', mohan: 'मोहन', sohan: 'सोहन', shyam: 'श्याम', krishna: 'कृष्णा',
  lakshmi: 'लक्ष्मी', laxmi: 'लक्ष्मी', gurpreet: 'गुरप्रीत', harpreet: 'हरप्रीत', manpreet: 'मनप्रीत', jaspreet: 'जसप्रीत',
  sukhwinder: 'सुखविंदर', baljeet: 'बलजीत', harjeet: 'हरजीत', rajinder: 'राजिंदर', surinder: 'सुरिंदर', gurmeet: 'गुरमीत',
  sonu: 'सोनू', monu: 'मोनू', pappu: 'पप्पू', guddu: 'गुड्डू', bablu: 'बबलू', babloo: 'बबलू', pinku: 'पिंकू', chhotu: 'छोटू',
  abdul: 'अब्दुल', bilal: 'बिलाल', kareem: 'करीम', karim: 'करीम', tinku: 'टिंकू', rinku: 'रिंकू', munna: 'मुन्ना',
  labour: 'लेबर', purana: 'पुराना', driver: 'ड्राइवर', manager: 'मैनेजर', munim: 'मुनीम', ji: 'जी',
};
// Ulta: Hindi -> Roman (pehli spelling)
const NAMES_REV = {};
for (const [k, v] of Object.entries(NAMES)) if (!NAMES_REV[v]) NAMES_REV[v] = k;

import { getLang } from '../i18n/index.js';

// ---------------- Roman -> देवनागरी ----------------
const CONS = [
  ['ksh', 'क्ष'], ['chh', 'छ'], ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'],
  ['bh', 'भ'], ['sh', 'श'], ['zh', 'ज़'],
  ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'],
  ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['f', 'फ़'],
  ['z', 'ज़'], ['q', 'क़'], ['x', 'क्स'],
];
// [Roman, swatantra swar, maatra]
const VOW = [
  ['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'], ['ou', 'औ', 'ौ'], ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'], ['oo', 'ऊ', 'ू'],
  ['uu', 'ऊ', 'ू'], ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु'], ['e', 'ए', 'े'], ['o', 'ओ', 'ो'],
];
const HALANT = '्';
const STOPS = new Set(['क', 'ख', 'ग', 'घ', 'त', 'थ', 'द', 'ध', 'प', 'फ', 'ब', 'भ', 'ट', 'ड']);
const ANUSVARA_BEFORE = new Set(['k', 'g', 'c', 'j', 't', 'd', 'p', 'b']);

function romanWordToDev(word) {
  const w = word.toLowerCase();
  if (NAMES[w]) return NAMES[w];
  // Pehle hisson me todo: { type: 'c', dev, roman } / { type: 'v', ind, mat, roman }
  const parts = [];
  for (let i = 0; i < w.length;) {
    const v = VOW.find(([r]) => w.startsWith(r, i));
    if (v) { parts.push({ type: 'v', ind: v[1], mat: v[2], roman: v[0] }); i += v[0].length; continue; }
    const c = CONS.find(([r]) => w.startsWith(r, i));
    if (c) { parts.push({ type: 'c', dev: c[1], roman: c[0] }); i += c[0].length; continue; }
    i += 1; // anjaan akshar chhod do
  }
  // "Rehman", "Mehmood": 'eh' + vyanjan = 'a' ki awaaz
  for (let i = 0; i + 2 < parts.length; i++) {
    if (parts[i].roman === 'e' && parts[i + 1].roman === 'h' && parts[i + 2].type === 'c') Object.assign(parts[i], { ind: 'अ', mat: '', roman: 'a' });
  }
  // Ek hi swar wala shabd aur wo 'a' ho to lamba: Lal, Ram
  const vowels = parts.filter((x) => x.type === 'v');
  if (vowels.length === 1 && vowels[0].roman === 'a' && parts[0].type === 'c') Object.assign(vowels[0], { mat: 'ा' });
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const prev = parts[i - 1];
    const next = parts[i + 1];
    if (p.type === 'v') {
      const last = i === parts.length - 1;
      if (prev && prev.type === 'c') {
        // Aakhri 'a' / 'i' / 'u' aksar lamba bola jaata hai: Ganga, Ali, Raju
        if (last && p.roman === 'a') out += 'ा';
        else if (last && p.roman === 'i') out += 'ी';
        else if (last && p.roman === 'u') out += 'ू';
        else out += p.mat;
      } else out += p.ind;
      continue;
    }
    // Vyanjan
    const afterVowel = prev && prev.type === 'v';
    if (p.roman === 'n' && afterVowel && next && next.type === 'c' && ANUSVARA_BEFORE.has(next.roman[0])) {
      out += 'ं'; // Ganga -> गंगा, Pinku -> पिंकू
      continue;
    }
    out += p.dev;
    if (next && next.type === 'c') {
      const wordStart = !prev; // Pradeep, Shyam, Krishna
      const doubled = next.dev === p.dev; // Guddu, Pappu
      const rya = ['र', 'य', 'व'].includes(next.dev) && STOPS.has(p.dev.replace('़', '')); // Chandra, Indra
      if (wordStart || doubled || rya) out += HALANT;
    }
  }
  return out;
}

// ---------------- देवनागरी -> Roman ----------------
const DEV_CONS = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n', च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n', ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n', प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'v', श: 'sh',
  ष: 'sh', स: 's', ह: 'h',
};
const NUKTA_CONS = { क: 'q', ख: 'kh', ग: 'g', ज: 'z', फ: 'f', ड: 'r', ढ: 'rh' };
const DEV_IND = { अ: 'a', आ: 'a', इ: 'i', ई: 'ee', उ: 'u', ऊ: 'u', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऋ: 'ri' };
const DEV_MAT = { 'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri' };

function devWordToRoman(word) {
  if (NAMES_REV[word]) return NAMES_REV[word];
  const chars = [...word.normalize('NFC')];
  // Aksharon me todo: { c: 'k' | null, v: 'a' | 'ee' | ... | '' (halant), inherent: bool }
  const units = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (DEV_CONS[ch]) {
      let c = DEV_CONS[ch];
      if (chars[i + 1] === '़') { c = NUKTA_CONS[ch] || c; i++; }
      const nx = chars[i + 1];
      if (nx === HALANT) { units.push({ c, v: '' }); i++; } else if (DEV_MAT[nx]) { units.push({ c, v: DEV_MAT[nx] }); i++; } else units.push({ c, v: 'a', inherent: true });
      continue;
    }
    if (DEV_IND[ch]) { units.push({ c: null, v: DEV_IND[ch] }); continue; }
    if (ch === 'ं' || ch === 'ँ') { units.push({ c: 'n', v: '' }); continue; }
    if (ch === 'ः') { units.push({ c: 'h', v: '' }); continue; }
  }
  // Schwa (chhupa 'a') hatao: aakhri akshar me, aur V-C(a)-C-V jaisi jagah (रहमान -> rahman)
  const last = units.length - 1;
  if (last > 0 && units[last].inherent) units[last].v = '';
  for (let i = 1; i < last; i++) {
    const u = units[i];
    if (!u.inherent) continue;
    const prevVowel = units[i - 1].v !== '';
    const next = units[i + 1];
    const nextHasVowel = next && next.c && next.v !== '';
    if (prevVowel && nextHasVowel) u.v = '';
  }
  const s = units.map((u) => (u.c || '') + u.v).join('');
  // ee aakhir me 'i' (अली -> Ali)
  return s.replace(/ee$/, 'i');
}

const hasDev = (s) => /[ऀ-ॿ]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "Naseem" -> "नसीम" (shabd-shabd karke; jo pehle se Hindi hai wo waisa hi) */
export function toDevanagari(text) {
  return String(text || '').split(/(\s+)/).map((w) => (hasLatin(w) && !hasDev(w) ? romanWordToDev(w) : w)).join('');
}

/** "रमेश कुमार" -> "Ramesh Kumar" */
export function toLatin(text) {
  return String(text || '').split(/(\s+)/).map((w) => (hasDev(w) ? cap(devWordToRoman(w)) : w)).join('');
}

/**
 * Bhasha ke hisab se labour ka naam: हिंदी me Devanagari, English/Hinglish me Roman.
 * Malik ne form me sahi naam (nameHi / nameEn) diya ho to wahi.
 */
export function nameIn(labour, lang) {
  if (!labour) return '';
  const name = String(labour.name || '');
  if (lang === 'hi') {
    if (labour.nameHi) return labour.nameHi;
    return hasLatin(name) ? toDevanagari(name) : name;
  }
  if (labour.nameEn) return labour.nameEn;
  return hasDev(name) && !hasLatin(name) ? toLatin(name) : name;
}

/** Abhi ki bhasha me labour ka naam (poore app me isi se dikhate hain) */
export const ln = (labour) => nameIn(labour, getLang());
