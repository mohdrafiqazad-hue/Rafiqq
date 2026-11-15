import { useMemo } from 'react';
import { useData } from '../data/DataContext.jsx';
import { DateBar, Stat } from '../components/common.jsx';
import { dayReport, fmtRs } from '../lib/calc.js';
import { dayText, openWhatsApp, parchiText } from '../lib/whatsapp.js';

export default function Roz({ date, setDate, openEntry }) {
  const D = useData();
  const day = useMemo(() => dayReport(D.labours, D.entries, date), [D.labours, D.entries, date]);
  const t = day.totals;
  const pendingCount = day.rows.filter((r) => !r.entry).length;

  return (
    <div className="screen">
      <DateBar date={date} onChange={setDate} />

      <div className="card">
        <div className="card-title">Din ka total</div>
        <div className="stats">
          <Stat label="Le gaye" value={t.t} />
          <Stat label="Wapis" value={t.r} />
          <Stat label="Lage" value={t.p} />
          <Stat label="Paisa bane" value={fmtRs(t.bane)} />
          <Stat label="Mila" value={fmtRs(t.m)} tone="green" />
          <Stat label="Entry baaki" value={pendingCount} tone={pendingCount ? 'orange' : 'green'} />
        </div>
        <div className="kul-baaki">
          <span>Sab ka kul baaki</span>
          <b>{t.c} cooler · <span className={t.baaki < 0 ? 'neg' : ''}>{fmtRs(t.baaki)}</span></b>
        </div>
        <button className="btn btn-wa full" onClick={() => openWhatsApp('', dayText(day))}>
          🟢 Din ka hisab WhatsApp karein
        </button>
      </div>

      {!day.rows.length && <div className="empty-card">Koi labour nahi hai.</div>}

      {day.rows.map((r) => (
        <div key={r.labour.id} className={`card lrow ${r.entry ? '' : 'lrow-pending'}`}>
          <div className="lrow-head">
            <button className="link-btn lrow-name" onClick={() => openEntry(r.labour.id)}>{r.labour.name}</button>
            {r.entry ? <span className="pill pill-green">✓ Entry hui</span> : <span className="pill pill-orange">Entry nahi hui</span>}
          </div>
          {r.entry && (
            <div className="lrow-grid">
              <span>Le gaye <b>{r.t}</b></span>
              <span>Wapis <b>{r.r}</b></span>
              <span>Lage <b>{r.p}</b></span>
              <span>Bane <b>{fmtRs(r.bane)}</b></span>
              <span>Mila <b>{fmtRs(r.m)}</b></span>
            </div>
          )}
          <div className="lrow-foot">
            <span>Kul baaki: <b>{r.c} cooler</b> · <b className={r.baaki < 0 ? 'neg' : ''}>{fmtRs(r.baaki)}</b></span>
            <span className="lrow-btns">
              <button className="btn btn-small" onClick={() => openEntry(r.labour.id)}>{r.entry ? '✎ Edit' : '+ Entry'}</button>
              <button className="btn btn-small btn-wa" onClick={() => openWhatsApp(r.labour.phone, parchiText(r, date))} aria-label={`${r.labour.name} ko parchi bhejein`}>
                Parchi
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
