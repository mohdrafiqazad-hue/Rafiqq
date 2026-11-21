// Chhote, baar-baar kaam aane wale components
import { useRef, useState } from 'react';
import { addDays, addMonths, addWeeks, fmtDateLong, fmtMonth, fmtWeek, monthGrid, today, weekStart, weekdayNames } from '../lib/dates.js';
import { fmtCell } from '../lib/reports.js';
import { useUI } from './ui.jsx';
import { canShareFiles, downloadFile, FORMATS, makeFile, shareFile } from '../export/index.js';
import { t } from '../i18n/index.js';

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
      <button className="nav-btn" onClick={() => onChange(addDays(date, -1))} aria-label={t('d.prevDay')}>‹</button>
      <button className="datebar-label" onClick={open}>
        <span>📅 {fmtDateLong(date)}</span>
        {date === today() ? <small className="pill pill-green">{t('c.today')}</small> : null}
        <input
          ref={ref}
          type="date"
          className="hidden-date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          tabIndex={-1}
          aria-label={t('d.pickDate')}
        />
      </button>
      <button className="nav-btn" onClick={() => onChange(addDays(date, 1))} aria-label={t('d.nextDay')}>›</button>
      {date !== today() && (
        <button className="today-btn" onClick={() => onChange(today())}>{t('c.today')}</button>
      )}
    </div>
  );
}

/**
 * Mahine ka calendar. marks: Map(date -> 'full' | 'part'); tap karke date chunein.
 * Pichli aur agli dono taraf ja sakte hain.
 */
export function MonthCalendar({ date, onPick, marks }) {
  const [ym, setYm] = useState(date.slice(0, 7));
  const [lastDate, setLastDate] = useState(date);
  if (date !== lastDate) {
    // Bahar se date badli (jaise ‹ › se) to calendar bhi us mahine par chala jaye
    setLastDate(date);
    if (date.slice(0, 7) !== ym) setYm(date.slice(0, 7));
  }
  const td = today();
  return (
    <div className="cal">
      <div className="cal-head">
        <button className="nav-btn small" onClick={() => setYm(addMonths(ym, -1))} aria-label={t('d.prevMonth')}>‹</button>
        <b>{fmtMonth(ym)}</b>
        <button className="nav-btn small" onClick={() => setYm(addMonths(ym, 1))} aria-label={t('d.nextMonth')}>›</button>
      </div>
      <div className="cal-grid">
        {weekdayNames().map((w, i) => <div key={`w${i}`} className="cal-wd">{w}</div>)}
        {monthGrid(ym).map((d, i) => (d ? (
          <button
            key={d}
            className={`cal-day ${d === date ? 'sel' : ''} ${d === td ? 'today' : ''} ${marks?.get(d) || ''}`}
            onClick={() => onPick(d)}
            aria-label={d}
            aria-pressed={d === date}
          >
            {Number(d.slice(8))}
          </button>
        ) : <span key={`e${i}`} />))}
      </div>
      <div className="cal-legend">
        <span><i className="lg full" /> {t('cal.full')}</span>
        <span><i className="lg part" /> {t('cal.part')}</span>
      </div>
    </div>
  );
}

/** Hafta chunne ki patti: ‹ 16 Nov – 22 Nov 2026 ›, beech me tap karke koi bhi date (uska hafta) */
export function WeekBar({ ws, onChange }) {
  const thisWeek = weekStart(today());
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(addWeeks(ws, -1))} aria-label={t('d.prevWeek')}>‹</button>
      <label className="datebar-label">
        <span>🗓️ {fmtWeek(ws)}</span>
        <input type="date" className="hidden-date" value={ws} onChange={(e) => e.target.value && onChange(weekStart(e.target.value))} aria-label={t('d.pickWeek')} />
      </label>
      <button className="nav-btn" onClick={() => onChange(addWeeks(ws, 1))} aria-label={t('d.nextWeek')}>›</button>
      {ws !== thisWeek && <button className="today-btn" onClick={() => onChange(thisWeek)}>{t('c.today')}</button>}
    </div>
  );
}

export function MonthBar({ ym, onChange }) {
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(addMonths(ym, -1))} aria-label={t('d.prevMonth')}>‹</button>
      <label className="datebar-label">
        <span>🗓️ {fmtMonth(ym)}</span>
        <input type="month" className="hidden-date" value={ym} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={t('d.pickMonth')} />
      </label>
      <button className="nav-btn" onClick={() => onChange(addMonths(ym, 1))} aria-label={t('d.nextMonth')}>›</button>
    </div>
  );
}

export function YearBar({ year, onChange }) {
  return (
    <div className="datebar">
      <button className="nav-btn" onClick={() => onChange(year - 1)} aria-label={t('d.prevYear')}>‹</button>
      <div className="datebar-label"><span>{t('c.year', { y: year })}</span></div>
      <button className="nav-btn" onClick={() => onChange(year + 1)} aria-label={t('d.nextYear')}>›</button>
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
export function NumField({ label, value, onChange, decimal = false, allowNegative = false, inputRef, onEnter, hint, disabled = false }) {
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
            aria-label={t('l.signToggle')}
          >
            {neg ? '−' : '+'}
          </button>
        )}
        <input
          ref={inputRef}
          disabled={disabled}
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
/** onRowClick(id): agar section.rowIds ho to pehle khane (naam) par dabane se */
export function ReportTable({ section, onRowClick }) {
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
                    {j === 0 && onRowClick && section.rowIds?.[i]
                      ? <button className="link-btn cell-link" onClick={() => onRowClick(section.rowIds[i])}>{fmtCell(cell, section.columns[j])}</button>
                      : fmtCell(cell, section.columns[j])}
                  </td>
                ))}
              </tr>
            ))}
            {!section.rows.length && (
              <tr><td colSpan={section.columns.length} className="muted">{t('c.noData')}</td></tr>
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
        toast(t('rep.downloaded', { f: FORMATS[format].label }));
      }
    } catch (e) {
      toast(t('rep.fileErr', { e: e?.message || e }), 'err', 6000);
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
          {busy === 'pdfs' ? '…' : t('rep.share')}
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
