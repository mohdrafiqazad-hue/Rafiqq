// Hafte ka hisab (Roz jaisa, bas Somvar se Ravivar). Labour ke naam par dabao to uska record.
import { useMemo } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Stat, WeekBar } from '../components/common.jsx';
import { fmtRs, ledger, periodReport } from '../lib/calc.js';
import { addDays, fmtDayShort, fmtWeek, weekEnd } from '../lib/dates.js';
import { expenseSummary } from '../lib/expenses.js';
import { khataText, openWhatsApp, weekText } from '../lib/whatsapp.js';
import { t } from '../i18n/index.js';
import PendingBanner from '../components/PendingBanner.jsx';

export default function Hafta({ ws, setWs, openKhata, openDay, openPending }) {
  const D = useData();
  const we = weekEnd(ws);
  const label = fmtWeek(ws);

  const pr = useMemo(() => periodReport(D.labours, D.entries, ws, we), [D.labours, D.entries, ws, we]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i);
    const n = D.entries.filter((e) => e.d === d).length;
    return { d, n, ...periodReport(D.labours, D.entries, d, d).totals };
  }), [D.labours, D.entries, ws]);
  const x = useMemo(() => (D.can.seeKharcha ? expenseSummary(D.entries, D.expenses, ws, we) : null), [D.can.seeKharcha, D.entries, D.expenses, ws, we]);
  const tt = pr.totals;
  const period = { mode: 'hafta', ws };

  return (
    <div className="screen">
      <WeekBar ws={ws} onChange={setWs} />
      <PendingBanner onOpen={openPending} />

      <div className="card">
        <div className="card-title">{t('h.total')}</div>
        <div className="stats">
          <Stat label={t('col.t')} value={tt.t} />
          <Stat label={t('col.r')} value={tt.r} />
          <Stat label={t('col.p')} value={tt.p} />
          <Stat label={t('col.bane')} value={fmtRs(tt.bane)} />
          <Stat label={t('col.m')} value={fmtRs(tt.m)} tone="green" />
          {x ? <Stat label={t('m.kharcha')} value={fmtRs(x.kharcha)} tone="orange" /> : <span />}
        </div>
        {x && (
          <div className="kul-baaki">
            <span>{t('m.bachat')} ({t('m.received')} − {t('m.kharcha')})</span>
            <b className={x.bachat < 0 ? 'neg' : ''}>{fmtRs(x.bachat)}</b>
          </div>
        )}
        <div className="kul-baaki">
          <span>{t('h.allBal')}</span>
          <b>{tt.c} {t('c.cooler')} · <span className={tt.baaki < 0 ? 'neg' : ''}>{fmtRs(tt.baaki)}</span></b>
        </div>
        <button className="btn btn-wa full" onClick={() => openWhatsApp('', weekText(pr, label))}>{t('h.wa')}</button>
      </div>

      <div className="card week-days">
        <div className="card-title">{t('rep.dayWise')}</div>
        {days.map((r) => (
          <button key={r.d} className="week-day" onClick={() => openDay(r.d)}>
            <span className="week-day-name">{fmtDayShort(r.d)}</span>
            <span className="week-day-vals">
              {r.n ? (
                <>
                  <span>{t('col.t')} <b>{r.t}</b></span>
                  <span>{t('col.m')} <b>{fmtRs(r.m)}</b></span>
                </>
              ) : <span className="muted">—</span>}
            </span>
            <span className="chev">›</span>
          </button>
        ))}
        <p className="muted small note">{t('h.dayTap')}</p>
      </div>

      <p className="muted small note">{t('h.tapName')}</p>
      {!pr.rows.length && <div className="empty-card">{t('r.noLabour')}</div>}

      {pr.rows.map((r) => (
        <div key={r.labour.id} className={`card lrow ${r.days ? '' : 'lrow-pending'}`}>
          <div className="lrow-head">
            <button className="link-btn lrow-name" onClick={() => openKhata(r.labour.id, period)}>
              {r.labour.name}{r.labour.archived ? t('c.archivedSuffix') : ''} ›
            </button>
            {r.days ? <span className="pill pill-green">{t('h.days', { n: r.days })}</span> : <span className="pill pill-orange">{t('h.noEntry')}</span>}
          </div>
          {r.days > 0 && (
            <div className="lrow-grid">
              <span>{t('col.t')} <b>{r.t}</b></span>
              <span>{t('col.r')} <b>{r.r}</b></span>
              <span>{t('col.p')} <b>{r.p}</b></span>
              <span>{t('r.bane')} <b>{fmtRs(r.bane)}</b></span>
              <span>{t('col.m')} <b>{fmtRs(r.m)}</b></span>
            </div>
          )}
          <div className="lrow-foot">
            <span className="bal-pills">{t('h.balEnd')}: <span className={`pill ${r.c > 0 ? 'pill-cool' : ''}`}>{r.c} {t('c.cooler')}</span> <span className={`pill ${r.baaki > 0 ? 'pill-money' : r.baaki < 0 ? 'pill-neg' : ''}`}>{fmtRs(r.baaki)}</span></span>
            <span className="lrow-btns">
              <button className="btn btn-small" onClick={() => openKhata(r.labour.id, period)}>{t('h.record')}</button>
              <button
                className="btn btn-small btn-wa"
                onClick={() => openWhatsApp(r.labour.phone, khataText(r.labour, ledger(r.labour, D.entries, ws, we), label))}
              >
                {t('h.sendWa')}
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
