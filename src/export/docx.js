// Word (.docx) file banana
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  ShadingType, PageOrientation,
} from 'docx';
import { COMPANY, fmtCell } from '../lib/reports.js';
import { fmtDateTime } from '../lib/dates.js';
import { t } from '../i18n/index.js';

// Hindi ke liye "cs" (complex script) font; Word phone/computer me jo Hindi font ho use le leta hai
const FONT = { ascii: 'Calibri', hAnsi: 'Calibri', cs: 'Nirmala UI', eastAsia: 'Calibri' };

const run = (text, opts = {}) => new TextRun({ text: String(text), font: FONT, size: 18, ...opts });

export async function reportToDocx(report) {
  const children = [
    new Paragraph({ children: [run(COMPANY, { bold: true, size: 32, color: '0D6688' })] }),
    new Paragraph({ children: [run(report.title, { bold: true, size: 26 })], spacing: { before: 80 } }),
  ];
  if (report.subtitle) children.push(new Paragraph({ children: [run(report.subtitle, { color: '666666' })] }));
  children.push(new Paragraph({ children: [run(t('rep.generated', { dt: fmtDateTime() }), { color: '666666' })], spacing: { after: 200 } }));

  for (const sec of report.sections) {
    if (sec.heading) {
      children.push(new Paragraph({ children: [run(sec.heading, { bold: true, size: 22, color: '0D6688' })], spacing: { before: 200, after: 80 } }));
    }
    const mkRow = (cells, { header = false, total = false } = {}) =>
      new TableRow({
        tableHeader: header,
        children: cells.map((cell, i) => {
          const c = sec.columns[i];
          return new TableCell({
            shading: header ? { type: ShadingType.CLEAR, fill: 'DCEEF5', color: 'auto' } : total ? { type: ShadingType.CLEAR, fill: 'EDEDE6', color: 'auto' } : undefined,
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({
              alignment: c.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
              children: [run(header ? c.label : fmtCell(cell, c), {
                bold: header || total,
                color: typeof cell === 'number' && cell < 0 ? 'B01818' : undefined,
              })],
            })],
          });
        }),
      });
    const rows = [mkRow(sec.columns.map((c) => c.label), { header: true }), ...sec.rows.map((r) => mkRow(r))];
    if (sec.total) rows.push(mkRow(sec.total, { total: true }));
    children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    if (!sec.rows.length) children.push(new Paragraph({ children: [run(t('c.noData'), { color: '666666' })] }));
  }

  const doc = new Document({
    creator: COMPANY,
    title: `${COMPANY} - ${report.title}`,
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.PORTRAIT }, margin: { top: 720, bottom: 720, left: 600, right: 600 } } },
      children,
    }],
  });
  return Packer.toBlob(doc);
}
