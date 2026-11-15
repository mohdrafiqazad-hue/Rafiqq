// PDF banana (pdf-lib). Hindi (Devanagari) ke liye Noto Sans Devanagari font PDF me embed hota hai,
// aur English letters ke liye Noto Sans. Har text ko script ke hisab se tukdon me baant kar sahi font se likha jaata hai.

import 'regenerator-runtime/runtime.js'; // fontkit ko Hindi shaping ke liye chahiye
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { COMPANY, fmtCell } from '../lib/reports.js';
import { fmtDateTime } from '../lib/dates.js';

const FONT_FILES = {
  dev: 'fonts/NotoSansDevanagari-Regular.ttf',
  devB: 'fonts/NotoSansDevanagari-Bold.ttf',
  lat: 'fonts/NotoSansLatin-Regular.ttf',
  latB: 'fonts/NotoSansLatin-Bold.ttf',
};

let fontBytesPromise;
function loadFontBytes(baseUrl) {
  if (!fontBytesPromise) {
    fontBytesPromise = Promise.all(
      Object.entries(FONT_FILES).map(async ([k, path]) => {
        const res = await fetch(baseUrl + path);
        if (!res.ok) throw new Error('PDF ka font load nahi hua. Internet chalu karke ek baar app kholein.');
        return [k, await res.arrayBuffer()];
      }),
    ).then(Object.fromEntries).catch((e) => {
      fontBytesPromise = null;
      throw e;
    });
  }
  return fontBytesPromise;
}

const isLatinLetter = (ch) => /[A-Za-zÀ-ɏ]/.test(ch);
const isDevanagari = (ch) => /[ऀ-ॿ᳐-᳿꣠-ꣿ‌‍]/.test(ch);

/** Text ko [ {text, latin} ] tukdon me baanto. Digits/space/punctuation pichle tukde ke saath jaate hain. */
export function splitRuns(text) {
  const runs = [];
  for (const ch of String(text)) {
    let latin;
    if (isLatinLetter(ch)) latin = true;
    else if (isDevanagari(ch)) latin = false;
    else latin = runs.length ? runs[runs.length - 1].latin : true;
    const last = runs[runs.length - 1];
    if (last && last.latin === latin) last.text += ch;
    else runs.push({ text: ch, latin });
  }
  return runs;
}

export async function reportToPdf(report, { baseUrl = '/' } = {}) {
  const bytes = await loadFontBytes(baseUrl);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${COMPANY} - ${report.title}`);
  doc.setCreator(COMPANY);
  const F = {
    dev: await doc.embedFont(bytes.dev, { subset: true }),
    devB: await doc.embedFont(bytes.devB, { subset: true }),
    lat: await doc.embedFont(bytes.lat, { subset: true }),
    latB: await doc.embedFont(bytes.latB, { subset: true }),
  };
  const fontFor = (latin, bold) => (latin ? (bold ? F.latB : F.lat) : bold ? F.devB : F.dev);

  const width = (text, size, bold) =>
    splitRuns(text).reduce((w, r) => w + fontFor(r.latin, bold).widthOfTextAtSize(r.text, size), 0);

  const fit = (text, size, bold, max) => {
    let s = String(text);
    if (width(s, size, bold) <= max) return s;
    const chars = [...s];
    while (chars.length > 1 && width(`${chars.join('')}…`, size, bold) > max) chars.pop();
    return `${chars.join('')}…`;
  };

  const PAGE = [595.28, 841.89]; // A4
  const M = 32;
  const usable = PAGE[0] - M * 2;
  const grey = rgb(0.4, 0.4, 0.4);
  const dark = rgb(0.1, 0.1, 0.12);
  const brand = rgb(0.05, 0.4, 0.55);

  let page;
  let y;
  const pages = [];

  const draw = (text, x, yy, size, { bold = false, color = dark } = {}) => {
    let cx = x;
    for (const r of splitRuns(text)) {
      const f = fontFor(r.latin, bold);
      page.drawText(r.text, { x: cx, y: yy, size, font: f, color });
      cx += f.widthOfTextAtSize(r.text, size);
    }
  };

  const newPage = () => {
    page = doc.addPage(PAGE);
    pages.push(page);
    y = PAGE[1] - M;
  };

  // ---- Header ----
  newPage();
  draw(COMPANY, M, y - 16, 18, { bold: true, color: brand });
  y -= 38;
  draw(report.title, M, y, 13, { bold: true });
  y -= 16;
  if (report.subtitle) {
    draw(fit(report.subtitle, 9, false, usable), M, y, 9, { color: grey });
    y -= 13;
  }
  draw(`Banaya: ${fmtDateTime()}`, M, y, 9, { color: grey });
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: PAGE[0] - M, y }, thickness: 1, color: brand });
  y -= 14;

  const FS = 8.5;
  const ROW_H = 17;

  for (const sec of report.sections) {
    const n = sec.columns.length;
    const wideW = Math.min(150, usable * 0.26);
    const otherW = (usable - wideW) / (n - 1);
    const widths = sec.columns.map((c) => (c.wide ? wideW : otherW));

    const HEAD_H = 26;
    const drawHeader = () => {
      if (y - HEAD_H < M + 20) newPage();
      page.drawRectangle({ x: M, y: y - HEAD_H + 4, width: usable, height: HEAD_H, color: rgb(0.86, 0.93, 0.96) });
      let x = M;
      sec.columns.forEach((c, i) => {
        const max = widths[i] - 6;
        let lines = [c.label];
        if (width(c.label, FS, true) > max && c.label.includes(' ')) {
          const words = c.label.split(' ');
          lines = [words.slice(0, -1).join(' '), words[words.length - 1]];
        }
        lines = lines.map((l) => fit(l, FS, true, max));
        const baseY = y - HEAD_H + 9 + (lines.length === 1 ? 5 : 10);
        lines.forEach((l, li) => {
          const w = width(l, FS, true);
          const tx = c.align === 'right' ? x + widths[i] - 3 - w : x + 3;
          draw(l, tx, baseY - li * 10, FS, { bold: true });
        });
        x += widths[i];
      });
      y -= HEAD_H;
    };

    const drawRow = (cells, { total = false, shade = false } = {}) => {
      if (y - ROW_H < M + 20) {
        newPage();
        drawHeader();
      }
      if (total || shade) {
        page.drawRectangle({
          x: M, y: y - ROW_H + 4, width: usable, height: ROW_H,
          color: total ? rgb(0.93, 0.93, 0.9) : rgb(0.97, 0.97, 0.97),
        });
      }
      let x = M;
      cells.forEach((cell, i) => {
        const c = sec.columns[i];
        const text = fit(fmtCell(cell, c), FS, total, widths[i] - 6);
        const w = width(text, FS, total);
        const tx = c.align === 'right' ? x + widths[i] - 3 - w : x + 3;
        const neg = typeof cell === 'number' && cell < 0;
        draw(text, tx, y - ROW_H + 9, FS, { bold: total, color: neg ? rgb(0.75, 0.1, 0.1) : dark });
        x += widths[i];
      });
      y -= ROW_H;
    };

    if (sec.heading) {
      if (y - 40 < M) newPage();
      draw(sec.heading, M, y - 4, 11, { bold: true, color: brand });
      y -= 18;
    }
    drawHeader();
    sec.rows.forEach((r, i) => drawRow(r, { shade: i % 2 === 1 }));
    if (!sec.rows.length) {
      draw('Koi data nahi', M + 3, y - 10, FS, { color: grey });
      y -= ROW_H;
    }
    if (sec.total) drawRow(sec.total, { total: true });
    y -= 16;
  }

  pages.forEach((p, i) => {
    page = p;
    draw(`${COMPANY} · Page ${i + 1}/${pages.length}`, M, 16, 8, { color: grey });
  });

  return new Blob([await doc.save()], { type: 'application/pdf' });
}
