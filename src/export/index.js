// Report download/share karne ke helper. Bhaari libraries zaroorat padne par hi load hoti hain.

export const FORMATS = {
  pdf: { label: 'PDF', ext: 'pdf', mime: 'application/pdf' },
  docx: { label: 'Word', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  xlsx: { label: 'Excel', ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
};

export async function makeFile(report, format) {
  let blob;
  if (format === 'pdf') blob = await (await import('./pdf.js')).reportToPdf(report, { baseUrl: import.meta.env.BASE_URL });
  else if (format === 'docx') blob = await (await import('./docx.js')).reportToDocx(report);
  else blob = await (await import('./xlsx.js')).reportToXlsx(report);
  const name = `MGM_${report.file}.${FORMATS[format].ext}`;
  return new File([blob], name, { type: FORMATS[format].mime });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function canShareFiles() {
  try {
    const f = new File(['x'], 'x.pdf', { type: 'application/pdf' });
    return !!(navigator.canShare && navigator.canShare({ files: [f] }));
  } catch {
    return false;
  }
}

export async function shareFile(file, title) {
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch (e) {
    if (e?.name === 'AbortError') return false;
    throw e;
  }
}
