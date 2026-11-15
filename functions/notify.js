// WhatsApp alert ka hisab aur message banana (pure functions, test ho sakte hain).
// App wale hisab (src/lib/calc.js) jaisa hi: baaki = opening + Σ(le gaye − wapis), Σ(lage×rate − mila).

const num = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};
const money = (x) => Math.round(num(x) * 100) / 100;

export const GRAPH_VERSION = 'v24.0';

/** Pichle aur naye month-document me se sirf NAYI judi entries */
export function newEntries(beforeMap = {}, afterMap = {}) {
  return Object.keys(afterMap)
    .filter((k) => !(k in beforeMap))
    .map((k) => afterMap[k])
    .filter((e) => e && e.l && e.d);
}

function prevDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}

/** Kisi date tak (us din ko mila kar) labour ka baaki */
export function balanceAt(labour, entries, date) {
  let c = 0;
  let m = 0;
  let after = '';
  if (labour.ob && labour.ob.d && labour.ob.d <= date) {
    c = num(labour.ob.c);
    m = num(labour.ob.m);
    after = labour.ob.d;
  }
  for (const e of entries) {
    if (e.l !== labour.id || e.d > date || e.d <= after) continue;
    c += num(e.t) - num(e.r);
    m += num(e.p) * num(e.k) - num(e.m);
  }
  return { c, m: money(m) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const fmtNum = (x) => money(x).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/**
 * Message ke 10 hisse (template ke {{1}}..{{10}}) aur poora text.
 * 1 labour, 2 date, 3 le gaye, 4 wapis, 5 market me baaki cooler, 6 lage,
 * 7 paisa bane, 8 paisa mila, 9 kul paisa baaki, 10 entry kisne ki
 */
export function buildMessage(labour, entries, e) {
  const prev = balanceAt(labour, entries, prevDay(e.d));
  const now = balanceAt(labour, entries, e.d);
  const bane = money(num(e.p) * num(e.k));
  const by = e.by ? `${e.by}${e.byRole ? ` (${e.byRole})` : ''}` : '-';
  const params = [
    String(labour.name || e.l),
    fmtDate(e.d),
    String(num(e.t)),
    String(num(e.r)),
    String(now.c),
    String(num(e.p)),
    fmtNum(bane),
    fmtNum(e.m),
    fmtNum(now.m),
    by,
  ].map((s) => s.replace(/[\n\t]+/g, ' ').replace(/ {4,}/g, '   ').slice(0, 200) || '-');
  const text = [
    '*Madhur Ganga Minerals* - nayi entry',
    `Labour: ${params[0]}`,
    `Date: ${params[1]}`,
    `Pichla baaki: ${prev.c} cooler`,
    `Cooler le gaye: ${params[2]}`,
    `Wapis aaye: ${params[3]}`,
    `Market me baaki: *${params[4]} cooler*`,
    `Lage: ${params[5]} | Paisa bane: ₹${params[6]}`,
    `Paisa mila: ₹${params[7]}`,
    `Kul paisa baaki: *₹${params[8]}*`,
    `Entry ki: ${params[9]}`,
  ].join('\n');
  return { params, text };
}

/** "98765 43210" -> "919876543210" */
export function toWaNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d;
}

/** WhatsApp Cloud API ko request ka body */
export function requestBody(cfg, msg) {
  const to = toWaNumber(cfg.ownerPhone);
  if (cfg.template) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: cfg.template,
        language: { code: cfg.lang || 'en' },
        components: [{ type: 'body', parameters: msg.params.map((text) => ({ type: 'text', text })) }],
      },
    };
  }
  // Template na ho to seedha text (sirf tab pahunchta hai jab malik ne pichle 24 ghante me business number par message kiya ho)
  return { messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body: msg.text } };
}

export async function sendWhatsApp(cfg, msg, { fetchImpl = fetch, base = 'https://graph.facebook.com' } = {}) {
  if (!cfg.phoneNumberId || !cfg.token || !cfg.ownerPhone) throw new Error('WhatsApp setting adhoori hai (Phone Number ID / Token / Malik ka number).');
  const res = await fetchImpl(`${base}/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody(cfg, msg)),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body?.error;
    throw new Error(`WhatsApp ${res.status}: ${err?.message || 'error'}${err?.code ? ` (code ${err.code})` : ''}`);
  }
  return body?.messages?.[0]?.id || 'ok';
}
