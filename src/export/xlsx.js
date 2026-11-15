// Excel (.xlsx) file banana. Har section ki alag sheet; numbers asli number rehte hain taaki Excel me jod sakein.
import ExcelJS from 'exceljs';
import { COMPANY } from '../lib/reports.js';
import { fmtDateTime } from '../lib/dates.js';

export async function reportToXlsx(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY;
  wb.created = new Date();

  report.sections.forEach((sec, si) => {
    const name = (sec.heading || (report.sections.length > 1 ? `Sheet ${si + 1}` : 'Report')).slice(0, 31);
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 5 }] });
    const n = sec.columns.length;

    ws.mergeCells(1, 1, 1, n);
    ws.getCell(1, 1).value = COMPANY;
    ws.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FF0D6688' } };
    ws.mergeCells(2, 1, 2, n);
    ws.getCell(2, 1).value = report.title + (sec.heading ? ` (${sec.heading})` : '');
    ws.getCell(2, 1).font = { bold: true, size: 12 };
    ws.mergeCells(3, 1, 3, n);
    ws.getCell(3, 1).value = `${report.subtitle ? `${report.subtitle} · ` : ''}Banaya: ${fmtDateTime()}`;
    ws.getCell(3, 1).font = { size: 9, color: { argb: 'FF666666' } };

    const header = ws.getRow(5);
    sec.columns.forEach((c, i) => {
      const cell = header.getCell(i + 1);
      cell.value = c.label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEEF5' } };
      cell.alignment = { horizontal: c.align === 'right' ? 'right' : 'left' };
      ws.getColumn(i + 1).width = c.wide ? 30 : 13;
      if (c.money) ws.getColumn(i + 1).numFmt = '"₹"#,##0.##;[Red]-"₹"#,##0.##';
      else if (c.align === 'right') ws.getColumn(i + 1).numFmt = '#,##0.##;[Red]-#,##0.##';
    });

    let r = 6;
    for (const row of sec.rows) {
      const xr = ws.getRow(r++);
      row.forEach((v, i) => {
        xr.getCell(i + 1).value = v === '' ? null : v;
        xr.getCell(i + 1).alignment = { horizontal: sec.columns[i].align === 'right' ? 'right' : 'left' };
      });
    }
    if (sec.total) {
      const xr = ws.getRow(r);
      sec.total.forEach((v, i) => {
        const cell = xr.getCell(i + 1);
        cell.value = v === '' ? null : v;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDE6' } };
      });
    }
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
