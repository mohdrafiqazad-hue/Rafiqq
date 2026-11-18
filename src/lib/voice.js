// Bol kar entry: suni hui line (Hindi, Hinglish, English, Punjabi) se
// labour ka naam aur 4 cheezein nikalna: le gaye (t), wapis (r), lage (p), paisa (m).
//
// Udaharan:
//   "Naseem 15 15 30 leke gaya, 50 lage, 10 wapis aaye, 500 rupaye diye"
//   "नसीम पंद्रह पंद्रह तीस ले गया पचास लगे दस वापस आए पांच सौ रुपये दिए"
//   "Naseem took 60 returned 10 placed 50 paid 500"
//   "ਨਸੀਮ 60 ਲੈ ਗਿਆ 10 ਵਾਪਸ 500 ਰੁਪਏ ਦਿੱਤੇ"
// Ek field ke kai number jud jaate hain (15 + 15 + 30 = 60).

// ---------------- Number words ----------------
const W = {};
const add = (words, v) => words.split(/\s+/).filter(Boolean).forEach((w) => { W[w] = v; });

// English
['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'].forEach((w, i) => { W[w] = i; });
add('twenty', 20); add('thirty', 30); add('forty fourty', 40); add('fifty', 50); add('sixty', 60);
add('seventy', 70); add('eighty', 80); add('ninety', 90);

// Hinglish (Roman me Hindi) — aam spelling
add('ek', 1); add('do', 2); add('teen tin', 3); add('char chaar', 4); add('panch paanch paach', 5);
add('chhe chhah che chah chhai', 6); add('saat sat', 7); add('aath aat', 8); add('nau', 9); add('das dus', 10);
add('gyarah gyara gyaarah', 11); add('barah bara baarah', 12); add('terah tera', 13); add('chaudah chauda', 14);
add('pandrah pandra', 15); add('solah sola', 16); add('satrah satra', 17); add('atharah athara atthara', 18);
add('unnis unees unis', 19); add('bees bis', 20); add('pachis pachchis pacchis', 25); add('tees tis', 30);
add('chalis chaalis', 40); add('pachas pachaas', 50); add('sattar', 70); add('assi', 80); add('nabbe', 90);

// हिंदी 0–100
add('शून्य', 0);
[
  'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
].forEach((w, i) => { W[w] = i + 1; });
add('पाँच पाच', 5); add('छः छे छै', 6); add('पन्द्रह', 15); add('सत्तरह', 17); add('अठ्ठारह', 18);

// ਪੰਜਾਬੀ
add('ਸਿਫ਼ਰ ਜ਼ੀਰੋ', 0);
['ਇੱਕ', 'ਦੋ', 'ਤਿੰਨ', 'ਚਾਰ', 'ਪੰਜ', 'ਛੇ', 'ਸੱਤ', 'ਅੱਠ', 'ਨੌਂ', 'ਦਸ', 'ਗਿਆਰਾਂ', 'ਬਾਰਾਂ', 'ਤੇਰਾਂ', 'ਚੌਦਾਂ', 'ਪੰਦਰਾਂ',
  'ਸੋਲਾਂ', 'ਸਤਾਰਾਂ', 'ਅਠਾਰਾਂ', 'ਉੱਨੀ', 'ਵੀਹ'].forEach((w, i) => { W[w] = i + 1; });
add('ਇਕ', 1); add('ਨੌ', 9); add('ਪੱਚੀ', 25); add('ਤੀਹ', 30); add('ਚਾਲੀ', 40); add('ਪੰਜਾਹ', 50);
add('ਸੱਠ', 60); add('ਸੱਤਰ', 70); add('ਅੱਸੀ', 80); add('ਨੱਬੇ', 90);

// Guna karne wale: sau / hazaar
const HUNDRED = new Set(['hundred', 'sau', 'सौ', 'ਸੌ']);
const THOUSAND = new Set(['thousand', 'hazaar', 'hazar', 'hajar', 'hajaar', 'हज़ार', 'हजार', 'ਹਜ਼ਾਰ', 'ਹਜਾਰ']);
// Aadha: dedh = 1.5, dhai = 2.5, saade X = X + 0.5
const DEDH = new Set(['dedh', 'derh', 'डेढ़', 'डेढ', 'ਡੇਢ']);
const DHAI = new Set(['dhai', 'dhaai', 'ढाई', 'ਢਾਈ']);
const SAADE = new Set(['saade', 'sade', 'sadhe', 'saadhe', 'साढ़े', 'साढे', 'ਸਾਢੇ']);

// ---------------- Keywords (kaunsa khana) ----------------
const KW = {};
const kw = (field, words) => words.split(/\s+/).filter(Boolean).forEach((w) => { KW[w] = field; });
kw('t', 'le leke lekar leker liye liya gaya gaye gya gye gyi gayi took taken take carried ले लेके लेकर लिए लिया गया गए गई ਲੈ ਲੈਕੇ ਲੈ ਕੇ ਗਿਆ ਗਏ ਲਏ');
kw('r', 'wapis vapis wapas vapas waapas vaapas wapsi lautaye lautae laute aaye aaye aaya aae aye returned return returns back वापस वापिस लौटाए लौटे आए आये आया ਵਾਪਸ ਮੋੜੇ ਮੁੜੇ ਆਏ');
kw('p', 'lage lagaye lagae lagaya laga lagi lagai lgaye lge installed install placed place put fitted fit लगे लगाए लगाये लगाया लगा ਲੱਗੇ ਲਾਏ ਲਗਾਏ ਲੱਗਿਆ');
kw('m', 'paise paisa pese paise rupaye rupay rupaiye rupaiya rupees rupee rs ₹ jama diye diya dia diye mila mile milaa paid pay gave cash money पैसे पैसा रुपये रुपए रुपया रूपये जमा दिए दिये दिया मिला मिले ਪੈਸੇ ਪੈਸਾ ਰੁਪਏ ਰੁਪਈਏ ਦਿੱਤੇ ਦਿੱਤਾ ਜਮ੍ਹਾ ਮਿਲੇ');

// English ke shabd number se PEHLE aate hain ("took 60"); Hindi/Punjabi ke aksar BAAD me ("60 le gaya")
const ENGLISH_KW = new Set('took taken take carried returned return returns back installed install placed place put fitted fit paid pay gave cash money'.split(' '));
// "₹500" / "Rs 500": nishaan ke baad wala number hamesha paisa
const MONEY_SIGN = new Set(['₹', 'rs']);

// Bekaar shabd (naam nahi)
const FILLER = new Set(('ne ke ki ka ko se aur or and plus me mein mai market cooler coolers kooler total kul aaj today ' +
  'the a an has have he she ji bhai wala wale bhi nahi nahin koi kuch entry labour sirf hai hain tha the ' +
  'ने के की का को से और में मार्केट कूलर कुल आज जी भाई वाला भी नहीं कोई कुछ है हैं था ' +
  'ਨੇ ਦੇ ਦੀ ਦਾ ਨੂੰ ਤੋਂ ਅਤੇ ਤੇ ਵਿੱਚ ਕੂਲਰ ਕੁੱਲ ਅੱਜ ਜੀ ਭਾਈ ਵੀ ਨਹੀਂ ਕੋਈ ਹੈ ਸੀ').split(/\s+/));

// ---------------- Text saaf karna ----------------
const DIGITS = { '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9, '੦': 0, '੧': 1, '੨': 2, '੩': 3, '੪': 4, '੫': 5, '੬': 6, '੭': 7, '੮': 8, '੯': 9 };

export function tokenize(text) {
  let s = String(text || '').toLowerCase();
  s = s.replace(/[०-९੦-੯]/g, (c) => DIGITS[c]);
  s = s.replace(/₹\s*/g, ' ₹ ');
  s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2'); // 1,500 -> 1500
  s = s.replace(/(\d)\.(\d)/g, '$1§$2'); // 2.5 bachao
  s = s.replace(/(\d+)(rs|rupaye|rupees|₹)/g, '$1 $2');
  return s
    .split(/[^\p{L}\p{M}\d§₹]+/u)
    .map((x) => x.replace('§', '.'))
    .filter(Boolean);
}

const isNumToken = (w) => /^\d+(\.\d+)?$/.test(w) || w in W || HUNDRED.has(w) || THOUSAND.has(w)
  || DEDH.has(w) || DHAI.has(w) || SAADE.has(w);

/** Lagatar number-shabdon ko alag-alag numbers me badlo: ["15","15","30"] -> [15,15,30]; ["paanch","sau"] -> [500] */
export function readNumbers(words) {
  const out = [];
  let total = 0;
  let cur = null; // abhi ka hissa
  let half = 0; // dedh/dhai/saade
  let afterSau = false; // "do sau pachas" = 250
  const flush = () => {
    if (cur !== null || total) out.push(total + (cur || 0));
    total = 0; cur = null; half = 0; afterSau = false;
  };
  for (const w of words) {
    if (DEDH.has(w)) { flush(); cur = 1; half = 0.5; continue; }
    if (DHAI.has(w)) { flush(); cur = 2; half = 0.5; continue; }
    if (SAADE.has(w)) { flush(); half = 0.5; cur = 0; continue; }
    if (HUNDRED.has(w)) { cur = ((cur || (half ? 0 : 1)) + half) * 100; half = 0; afterSau = true; continue; }
    if (THOUSAND.has(w)) { total += ((cur || (half ? 0 : 1)) + half) * 1000; cur = null; half = 0; afterSau = false; continue; }
    const v = /^\d/.test(w) ? Number(w) : W[w];
    if (half && cur === 0) { cur = v; continue; } // "saade teen" -> 3 (.5 baad me sau/hazaar par)
    if (cur === null) { cur = v; afterSau = false; continue; }
    if (afterSau && v < 100) { cur += v; afterSau = false; continue; }
    // "twenty five" jaisa jodna (sirf English tens + unit)
    if (cur % 10 === 0 && cur >= 20 && cur < 100 && v < 10 && !/^\d/.test(w)) { cur += v; continue; }
    // hazaar ke baad chhota number: "2 hazaar 500"
    flush();
    cur = v;
  }
  flush();
  return out.map((n) => Math.round(n * 100) / 100);
}

// ---------------- Naam milana (Hindi/Punjabi/English kisi bhi likhawat me) ----------------
const DEV = {
  क: 'k', ख: 'k', ग: 'g', घ: 'g', ङ: 'n', च: 'c', छ: 'c', ज: 'j', झ: 'j', ञ: 'n', ट: 't', ठ: 't', ड: 'd', ढ: 'd', ण: 'n',
  त: 't', थ: 't', द: 'd', ध: 'd', न: 'n', प: 'p', फ: 'f', ब: 'b', भ: 'b', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'v', श: 's',
  ष: 's', स: 's', ह: 'h', 'ं': 'n', 'ँ': 'n', 'ड़': 'r', 'ढ़': 'r',
  ਕ: 'k', ਖ: 'k', ਗ: 'g', ਘ: 'g', ਙ: 'n', ਚ: 'c', ਛ: 'c', ਜ: 'j', ਝ: 'j', ਞ: 'n', ਟ: 't', ਠ: 't', ਡ: 'd', ਢ: 'd', ਣ: 'n',
  ਤ: 't', ਥ: 't', ਦ: 'd', ਧ: 'd', ਨ: 'n', ਪ: 'p', ਫ: 'f', ਬ: 'b', ਭ: 'b', ਮ: 'm', ਯ: 'y', ਰ: 'r', ਲ: 'l', ਵ: 'v', ਸ: 's',
  ਹ: 'h', ੜ: 'r', 'ਂ': 'n', 'ੰ': 'n',
};
// nukta wale
const NUKTA = { क: 'k', ख: 'k', ग: 'g', ज: 'j', फ: 'f', ड: 'r', ढ: 'r', ਸ: 's', ਖ: 'k', ਗ: 'g', ਜ: 'j', ਫ: 'f', ਲ: 'l' };

/** Naam ka "dhaancha": sirf vyanjan, ek likhawat me (vowel aur 'h' hata kar). naseem / नसीम / ਨਸੀਮ -> "nsm" */
export function skeleton(word) {
  let s = '';
  const chars = [...String(word).normalize('NFC').toLowerCase()];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (chars[i + 1] === '़' || chars[i + 1] === '਼') { s += NUKTA[c] || DEV[c] || ''; i++; continue; }
    if (DEV[c]) { s += DEV[c]; continue; }
    if (/[a-z]/.test(c)) s += c;
  }
  s = s
    .replace(/ph/g, 'f').replace(/w/g, 'v').replace(/z/g, 'j').replace(/q/g, 'k').replace(/x/g, 'ks')
    .replace(/[aeiouh]/g, '')
    .replace(/(.)\1+/g, '$1');
  return s;
}

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Bole gaye shabdon me se labour dhoondho. Pakka na ho (do barabar mile) to null. */
export function matchLabour(words, labours) {
  const cands = [];
  const sk = words.map(skeleton);
  for (const l of labours) {
    const parts = String(l.name).split(/\s+/).filter(Boolean).map(skeleton).filter(Boolean);
    if (!parts.length) continue;
    const full = parts.join('');
    let best = Infinity;
    let len = 0;
    for (let i = 0; i < sk.length; i++) {
      if (!sk[i]) continue;
      // poora naam (do shabd tak) ya sirf pehla naam
      const pair = sk[i] + (sk[i + 1] || '');
      const options = [[full, pair], [full, sk[i]], [parts[0], sk[i]]];
      for (const [target, said] of options) {
        if (!said || said[0] !== target[0]) continue;
        const d = editDistance(target, said);
        const allowed = target.length <= 3 ? 0 : 1;
        if (d <= allowed && (d < best || (d === best && target.length > len))) { best = d; len = target.length; }
      }
    }
    if (best < Infinity) cands.push({ l, best, len });
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.best - b.best || b.len - a.len);
  if (cands.length > 1 && cands[0].best === cands[1].best && cands[0].len === cands[1].len) return null;
  return cands[0].l;
}

// ---------------- Poori line samajhna ----------------
const FIELDS = ['t', 'r', 'p', 'm'];

/**
 * @returns {{ labour, fields: { t?: {value, parts}, ... }, leftover: number[], words: string[] }}
 */
export function parseVoice(text, labours = []) {
  const words = tokenize(text);
  // Shabdon ko "tukdon" me baanto: number ka tukda, keyword, ya baaki
  const items = [];
  let numRun = [];
  const flushNums = () => {
    if (numRun.length) items.push({ type: 'num', values: readNumbers(numRun) });
    numRun = [];
  };
  const nameWords = [];
  for (const w of words) {
    if (isNumToken(w)) { numRun.push(w); continue; }
    flushNums();
    if (KW[w]) { items.push({ type: 'kw', field: KW[w], eng: ENGLISH_KW.has(w), unit: MONEY_SIGN.has(w) }); continue; }
    if (!FILLER.has(w)) nameWords.push(w);
  }
  flushNums();

  const labour = matchLabour(nameWords, labours);
  const fields = {};
  const put = (field, values) => {
    if (!values.length) return;
    const f = fields[field] || { value: 0, parts: [] };
    f.parts.push(...values);
    f.value = Math.round(f.parts.reduce((x, y) => x + y, 0) * 100) / 100;
    fields[field] = f;
  };
  const leftover = [];

  // 1) "₹500" / "Rs 500": nishaan ke baad wala number seedha "paisa mila" me
  const used = new Set();
  items.forEach((it, i) => {
    if (it.type !== 'kw' || !it.unit) return;
    const next = items[i + 1];
    const prev = items[i - 1];
    if (next && next.type === 'num' && !used.has(i + 1)) { put('m', next.values); used.add(i + 1); } else if (prev && prev.type === 'num' && !used.has(i - 1)) { put('m', prev.values); used.add(i - 1); }
    used.add(i);
  });
  // 2) Baaki items; lagatar ek hi khane ke shabd ek "run" ("le gaya" = ek)
  const rest = [];
  items.forEach((it, i) => {
    if (used.has(i)) return;
    const last = rest[rest.length - 1];
    if (it.type === 'kw' && last && last.type === 'kw' && last.field === it.field) { last.eng = last.eng || it.eng; return; }
    rest.push({ ...it });
  });

  if (!rest.some((x) => x.type === 'kw')) {
    // Koi shabd nahi: "Naseem 60 10 50 500" = le gaye, wapis, lage, paisa (form ke kram me)
    const nums = rest.filter((x) => x.type === 'num').flatMap((x) => x.values);
    const free = FIELDS.filter((f) => !fields[f]);
    nums.slice(0, free.length).forEach((n, i) => put(free[i], [n]));
    leftover.push(...nums.slice(free.length));
    return { labour, fields, leftover, words, order: 'sequence' };
  }

  // 3) Hindi wale shabd number ke baad aaye ("60 le gaya") ya pehle ("wapis 10")? Is line me jo zyada ho.
  let before = 0; // num -> shabd
  let after = 0; // shabd -> num
  rest.forEach((it, i) => {
    const next = rest[i + 1];
    if (!next) return;
    if (it.type === 'num' && next.type === 'kw' && !next.eng) before++;
    if (it.type === 'kw' && !it.eng && next.type === 'num') after++;
  });
  const endsWithNum = rest[rest.length - 1].type === 'num';
  const prefix = after > before || (after === before && endsWithNum);

  let buf = [];
  let open = null;
  let lastRun = null;
  let lastGot = false;
  for (const it of rest) {
    if (it.type === 'num') {
      if (open) { put(open, it.values); lastGot = true; } else buf.push(...it.values);
      continue;
    }
    if (it.eng || prefix) {
      leftover.push(...buf);
      buf = [];
      open = it.field;
      lastRun = it;
      lastGot = false;
    } else {
      open = null;
      lastRun = it;
      lastGot = buf.length > 0;
      put(it.field, buf);
      buf = [];
    }
  }
  if (buf.length) {
    if (lastRun && !lastGot) put(lastRun.field, buf);
    else leftover.push(...buf);
  }
  return { labour, fields, leftover, words, order: prefix ? 'prefix' : 'postfix' };
}

/** Kai alternatives me se sabse achha (naam mila + zyada khane bhare) */
export function bestParse(alternatives, labours) {
  let best = null;
  let bestScore = -1;
  for (const text of alternatives) {
    const p = parseVoice(text, labours);
    const score = (p.labour ? 10 : 0) + Object.keys(p.fields).length * 2 - p.leftover.length;
    if (score > bestScore) { best = { ...p, text }; bestScore = score; }
  }
  return best;
}

/** Recognition ki bhasha */
export const VOICE_LANGS = [
  ['hi-IN', 'हिंदी / Hinglish'],
  ['en-IN', 'English'],
  ['pa-IN', 'ਪੰਜਾਬੀ'],
];
