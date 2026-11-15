// WhatsApp message banana aur wa.me link kholna
import { fmtRs, parchi as calcParchi } from './calc.js';
import { fmtDate } from './dates.js';
import { COMPANY } from './reports.js';

/** "98765 43210" -> "919876543210". Galat number ho to "" */
export function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 11 && d.length <= 15 ? d : '';
}

export function waLink(phone, text) {
  const n = waNumber(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone, text) {
  window.open(waLink(phone, text), '_blank', 'noopener');
}

/** Ek labour ki ek din ki parchi */
export function parchiText(row, date) {
  const P = calcParchi({ c: row.prevC, m: row.prevM }, row, row.k);
  const lines = [
    `*${COMPANY}*`,
    `Parchi: ${fmtDate(date)}`,
    `Labour: ${row.labour.name}`,
    '',
  ];
  if (!row.entry) {
    lines.push('Aaj ki entry nahi hui.', '');
  } else {
    lines.push(
      `Pichla baaki: ${P.prevC} cooler`,
      `+ Le gaye: ${P.t}`,
      `− Wapis aaye: ${P.r}`,
      `= Market me baaki: *${P.coolerBaaki} cooler*`,
      '',
      `Lage: ${P.p} × ${fmtRs(P.k)} = ${fmtRs(P.paisaBane)}`,
      `Pichla paisa baaki: ${fmtRs(P.prevM)}`,
      `− Paisa mila: ${fmtRs(P.mila)}`,
      '',
    );
  }
  lines.push(`*Kul baaki: ${row.c} cooler · ${fmtRs(row.baaki)}*`);
  return lines.join('\n');
}

/** Pure din ka saar (sab labour) */
export function dayText(day) {
  const lines = [`*${COMPANY}*`, `Roz ka hisab: ${fmtDate(day.date)}`, ''];
  for (const r of day.rows) {
    if (!r.entry) lines.push(`${r.labour.name}: entry nahi · baaki ${r.c} cooler, ${fmtRs(r.baaki)}`);
    else lines.push(`${r.labour.name}: le gaye ${r.t}, wapis ${r.r}, lage ${r.p}, mila ${fmtRs(r.m)} · baaki ${r.c} cooler, ${fmtRs(r.baaki)}`);
  }
  const t = day.totals;
  lines.push('', `*Din ka total:* le gaye ${t.t}, wapis ${t.r}, lage ${t.p}, paisa bane ${fmtRs(t.bane)}, mila ${fmtRs(t.m)}`);
  lines.push(`*Kul baaki:* ${t.c} cooler · ${fmtRs(t.baaki)}`);
  return lines.join('\n');
}

/** Labour ka khata (period) */
export function khataText(labour, L, label) {
  const lines = [`*${COMPANY}*`, `Hisab: ${labour.name}`, `${label}`, ''];
  lines.push(`Pichla baaki: ${L.opening.c} cooler · ${fmtRs(L.opening.baaki)}`);
  const rows = L.rows.slice(-40);
  if (L.rows.length > rows.length) lines.push(`(pehle ki ${L.rows.length - rows.length} entries chhod di gayi)`);
  for (const r of rows) {
    if (r.kind === 'ob') lines.push(`${fmtDate(r.d)}: Opening baaki ${r.c} cooler · ${fmtRs(r.baaki)}`);
    else lines.push(`${fmtDate(r.d)}: le ${r.t}, wapis ${r.r}, lage ${r.p} (${fmtRs(r.bane)}), mila ${fmtRs(r.m)} → ${r.c} cooler, ${fmtRs(r.baaki)}`);
  }
  const t = L.totals;
  lines.push('', `Kul: le gaye ${t.t}, wapis ${t.r}, lage ${t.p}, paisa bane ${fmtRs(t.bane)}, mila ${fmtRs(t.m)}`);
  lines.push(`*Abhi baaki: ${t.c} cooler · ${fmtRs(t.baaki)}*`);
  return lines.join('\n');
}
