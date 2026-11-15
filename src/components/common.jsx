// Chhote, baar-baar kaam aane wale components
import { useRef, useState } from 'react';
import { addDays, addMonths, fmtDateLong, fmtMonth, today } from '../lib/dates.js';
import { fmtCell } from '../lib/reports.js';
import { useUI } from './ui.jsx';
import { canShareFiles, downloadFile, FORMATS, makeFile, shareFile } from '../export/index.js';

export function DateBar({ date, onChange }) {
  const ref = useRef(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (el.showPicker) {
      try { el.showPicker(); return; } catch { /* purane browser */ }
    }
    el.focus();
    el.click();
  };
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(addDays(date, -1))} aria-label="Pichla din">‹</button>
      <button className="datebar-label" onClick={open}>
        <span>📅 {fmtDateLong(date)}</span>
        {date === today() ? <small className="pill pill-green">Aaj</small> : null}
        <input
          ref={ref}
          type="date"
          className="hidden-date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          tabIndex={-1}
          aria-label="Date chunein"
        />
      </button>
      <button className="nav-btn" onClick={() => onChange(addDays(date, 1))} aria-label="Agla din">›</button>
      {date !== today() && (
        <button className="today-btn" onClick={() => onChange(today())}>Aaj</button>
      )}
    </div>
  );
}

export function MonthBar({ ym, onChange }) {
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(addMonths(ym, -1))} aria-label="Pichla mahina">‹</button>
      <label className="datebar-label">
        <span>🗓️ {fmtMonth(ym)}</span>
        <input type="month" className="hidden-date" value={ym} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Mahina chunein" />
      </label>
      <button className="nav-btn" onClick={() => onChange(addMonths(ym, 1))} aria-label="Agla mahina">›</button>
    </div>
  );
}

export function YearBar({ year, onChange }) {
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(year - 1)} aria-label="Pichla saal">‹</button>
      <div className="datebar-label"><span>Saal {year}</span></div>
      <button className="nav-btn" onClick={() => onChange(year + 1)} aria-label="Agla saal">›</button>
    </div>
  );
}

export function Segmented({ value, options, onChange, small }) {
  return (
    <div className={`seg ${small ? 'seg-small' : ''}`} role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Number wala input: phone par number keypad khulta hai */
export function NumField({ label, value, onChange, decimal = false, allowNegative = false, inputRef, onEnter, hint }) {
  const neg = String(value).startsWith('-');
  const clean = (s) => {
    let v = s.replace(decimal ? /[^\d.]/g : /\D/g, '');
    if (decimal) {
      const i = v.indexOf('.');
      if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
    }
    return v.slice(0, 9);
  };
  return (
    <label className="numfield">
      <span className="numfield-label">{label}</span>
      <span className="numfield-row">
        {allowNegative && (
          <button
            type="button"
            className={`sign-btn ${neg ? 'neg' : ''}`}
            onClick={() => onChange(neg ? String(value).slice(1) : `-${value}`)}
            aria-label="Plus/minus badlein"
          >
            {neg ? '−' : '+'}
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          pattern={decimal ? '[0-9.]*' : '[0-9]*'}
          enterKeyHint="next"
          autoComplete="off"
          placeholder="0"
          value={neg ? String(value).slice(1) : value}
          onChange={(e) => onChange((neg ? '-' : '') + clean(e.target.value))}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
        />
      </span>
      {hint && <span className="numfield-hint">{hint}</span>}
    </label>
  );
}

/** Report model ko table ki tarah dikhana */
export function ReportTable({ section }) {
  return (
    <div className="table-wrap">
      {section.heading && <h4 className="table-heading">{section.heading}</h4>}
      <div className="table-scroll">
        <table className="rtable">
          <thead>
            <tr>{section.columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'num' : ''}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={`${section.columns[j].align === 'right' ? 'num' : ''} ${typeof cell === 'number' && cell < 0 ? 'neg' : ''}`}>
                    {fmtCell(cell, section.columns[j])}
                  </td>
                ))}
              </tr>
            ))}
            {!section.rows.length && (
              <tr><td colSpan={section.columns.length} className="muted">Koi data nahi</td></tr>
            )}
          </tbody>
          {section.total && (
            <tfoot>
              <tr>
                {section.total.map((cell, j) => (
                  <td key={j} className={`${section.columns[j].align === 'right' ? 'num' : ''} ${typeof cell === 'number' && cell < 0 ? 'neg' : ''}`}>
                    {fmtCell(cell, section.columns[j])}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/** PDF / Word / Excel download (aur share) buttons */
export function DownloadBar({ getReport }) {
  const { toast } = useUI();
  const [busy, setBusy] = useState('');
  const go = async (format, share = false) => {
    setBusy(format + (share ? 's' : ''));
    try {
      const report = getReport();
      const file = await makeFile(report, format);
      if (share) await shareFile(file, report.title);
      else {
        downloadFile(file);
        toast(`${FORMATS[format].label} file download ho gayi ✓`);
      }
    } catch (e) {
      toast(`File nahi bani: ${e?.message || e}`, 'err', 6000);
    } finally {
      setBusy('');
    }
  };
  const canShare = canShareFiles();
  return (
    <div className="dlbar">
      <div className="dlbar-row">
        {Object.entries(FORMATS).map(([k, f]) => (
          <button key={k} className={`btn btn-dl dl-${k}`} disabled={!!busy} onClick={() => go(k)}>
            {busy === k ? '…' : '⬇'} {f.label}
          </button>
        ))}
      </div>
      {canShare && (
        <button className="btn btn-wa" disabled={!!busy} onClick={() => go('pdf', true)}>
          {busy === 'pdfs' ? '…' : '📤'} PDF share karein (WhatsApp)
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-v">{value}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}
