import { useMemo } from 'react';
import { useData } from '../data/DataContext.jsx';
import { DateBar, Stat } from '../components/common.jsx';
import { dayReport, fmtRs } from '../lib/calc.js';
import { dayText, openWhatsApp, parchiText } from '../lib/whatsapp.js';
import { t } from '../i18n/index.js';
import { weekStart } from '../lib/dates.js';
import { catIcon, catName, expensesIn, totalExpense } from '../lib/expenses.js';

export default function Roz({ date, setDate, openEntry, openKhata }) {
  const D = useData();
  const day = useMemo(() => dayReport(D.labours, D.entries, date), [D.labours, D.entries, date]);
  const tt = day.totals;
  const pendingCount = day.rows.filter((r) => !r.entry).length;
  const dayX = useMemo(() => expensesIn(D.expenses, date, date), [D.expenses, date]);

  return (
    <div className="screen">
      <DateBar date={date} onChange={setDate} />

      <div className="card">
        <div className="card-title">{t('r.dayTotal')}</div>
        <div className="stats">
          <Stat label={t('col.t')} value={tt.t} />
          <Stat label={t('col.r')} value={tt.r} />
          <Stat label={t('col.p')} value={tt.p} />
          <Stat label={t('col.bane')} value={fmtRs(tt.bane)} />
          <Stat label={t('col.m')} value={fmtRs(tt.m)} tone="green" />
          <Stat label={t('r.pending')} value={pendingCount} tone={pendingCount ? 'orange' : 'green'} />
        </div>
        <div className="kul-baaki">
          <span>{t('r.allBal')}</span>
          <b>{tt.c} {t('c.cooler')} · <span className={tt.baaki < 0 ? 'neg' : ''}>{fmtRs(tt.baaki)}</span></b>
        </div>
        <button className="btn btn-wa full" onClick={() => openWhatsApp('', dayText(day))}>
          {t('r.waDay')}
        </button>
      </div>

      {dayX.length > 0 && (
        <div className="card">
          <div className="card-title">{t('r.dayKharcha')}: {fmtRs(totalExpense(dayX))}</div>
          {dayX.map((x) => (
            <div key={x.id} className="xrow-mini">
              <span>{catIcon(x.c)} {catName(x.c, D.xcats)}{x.p ? ` · ${x.p}` : ''}</span>
              <b>{fmtRs(x.a)}</b>
            </div>
          ))}
        </div>
      )}

      {!day.rows.length && <div className="empty-card">{t('r.noLabour')}</div>}

      {day.rows.map((r) => (
        <div key={r.labour.id} className={`card lrow ${r.entry ? '' : 'lrow-pending'}`}>
          <div className="lrow-head">
            <button className="link-btn lrow-name" onClick={() => openKhata(r.labour.id, { mode: 'mahina', ym: date.slice(0, 7), ws: weekStart(date) })}>{r.labour.name} ›</button>
            {r.entry ? <span className="pill pill-green">{t('r.done')}</span> : <span className="pill pill-orange">{t('r.notDone')}</span>}
          </div>
          {r.entry && (
            <div className="lrow-grid">
              <span>{t('col.t')} <b>{r.t}</b></span>
              <span>{t('col.r')} <b>{r.r}</b></span>
              <span>{t('col.p')} <b>{r.p}</b></span>
              <span>{t('r.bane')} <b>{fmtRs(r.bane)}</b></span>
              <span>{t('col.m')} <b>{fmtRs(r.m)}</b></span>
            </div>
          )}
          <div className="lrow-foot">
            <span>{t('r.kulBaaki')} <b>{r.c} {t('c.cooler')}</b> · <b className={r.baaki < 0 ? 'neg' : ''}>{fmtRs(r.baaki)}</b></span>
            <span className="lrow-btns">
              <button className="btn btn-small" onClick={() => openKhata(r.labour.id, { mode: 'mahina', ym: date.slice(0, 7), ws: weekStart(date) })}>{t('h.record')}</button>
              <button className="btn btn-small" onClick={() => openEntry(r.labour.id)}>{r.entry ? (D.can.editEntry ? t('r.edit') : t('pm.view')) : t('r.add')}</button>
              <button className="btn btn-small btn-wa" onClick={() => openWhatsApp(r.labour.phone, parchiText(r, date))} aria-label={t('r.sendParchi', { name: r.labour.name })}>
                {t('r.parchi')}
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
