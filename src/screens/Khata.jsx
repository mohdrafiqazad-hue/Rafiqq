import { useEffect, useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { DownloadBar, NumField, ReportTable } from '../components/common.jsx';
import { balanceAt, fmtRs, ledger } from '../lib/calc.js';
import { fmtDate, isValidISO, today } from '../lib/dates.js';
import { buildLabourReport, periodRange } from '../lib/reports.js';
import { openWhatsApp, khataText, waNumber } from '../lib/whatsapp.js';
import { LabourForm } from './Labours.jsx';
import { PeriodPicker, defaultPeriod } from './Report.jsx';
import { t } from '../i18n/index.js';
import { ln } from '../lib/translit.js';

function OpeningForm({ labour, onSave, onRemove, onClose, hasEntriesBefore }) {
  const [d, setD] = useState(labour.ob?.d || today());
  const [c, setC] = useState(labour.ob ? String(labour.ob.c) : '');
  const [m, setM] = useState(labour.ob ? String(labour.ob.m) : '');
  const [err, setErr] = useState('');
  return (
    <Sheet title={t('l.obTitle')} onClose={onClose}>
      <p className="muted small">{t('l.obHelp')}</p>
      <label className="field">
        <span>{t('l.obDate')}</span>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
      </label>
      <div className="grid2">
        <NumField label={t('l.obC')} value={c} onChange={setC} allowNegative />
        <NumField label={t('l.obM')} value={m} onChange={setM} allowNegative decimal />
      </div>
      {hasEntriesBefore(d) && (
        <div className="warn-box">{t('l.obWarn')}</div>
      )}
      {err && <div className="error-box">{err}</div>}
      <div className="row-actions">
        {labour.ob && <button className="btn btn-danger-outline" onClick={onRemove}>{t('l.obRemove')}</button>}
        <button
          className="btn btn-primary btn-big grow"
          onClick={() => {
            if (!isValidISO(d)) return setErr(t('l.obErrDate'));
            onSave({ d, c: Number(c) || 0, m: Number(m) || 0 });
          }}
        >
          {t('c.save')}
        </button>
      </div>
    </Sheet>
  );
}

export default function Khata({ labour, onBack, initialPeriod }) {
  const D = useData();
  const { confirm } = useUI();
  const [period, setPeriod] = useState(() => ({ ...defaultPeriod(), ...(initialPeriod || {}) }));
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(false);

  // Phone ka "back" button khata band kare
  useEffect(() => {
    if (window.history.state?.khata !== labour.id) window.history.pushState({ khata: labour.id }, '');
    const onPop = () => onBack();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const back = () => window.history.back();

  const list = D.byLabour.get(labour.id) || [];
  const now = balanceAt(labour, list, '9999-12-31');
  const { from, to, label } = periodRange(period);
  const L = useMemo(() => ledger(labour, D.entries, from, to), [labour, D.entries, from, to]);
  const report = useMemo(() => buildLabourReport(labour, D.entries, period), [labour, D.entries, period]);

  const archive = async () => {
    const ok = await confirm({
      title: t('l.archiveTitle', { name: ln(labour) }),
      message: t('l.archiveMsg'),
      okText: t('l.archiveOk'),
      danger: true,
    });
    if (ok) {
      D.saveLabour({ ...labour, archived: true }, t('l.archived1', { name: ln(labour) }));
      back();
    }
  };

  return (
    <div className="screen">
      <div className="subhead">
        <button className="btn btn-small" onClick={back}>{t('c.back')}</button>
        <div className="subhead-title">{ln(labour)}{labour.archived ? t('c.archivedSuffix') : ''}</div>
      </div>

      <div className="card">
        <div className="muted small">{labour.phone ? `📞 ${labour.phone}` : t('l.phoneNone')}</div>
        <div className="kul-baaki big">
          <span>{t('l.nowBal')}</span>
          <b>{now.c} {t('c.cooler')} · <span className={now.m < 0 ? 'neg' : ''}>{fmtRs(now.m)}</span></b>
        </div>
        {labour.ob && (
          <div className="muted small">{t('l.obInfo', { date: fmtDate(labour.ob.d), c: labour.ob.c, m: fmtRs(labour.ob.m) })}</div>
        )}
        {D.can.editLabour && <div className="btn-wrap">
          <button className="btn btn-small" onClick={() => setEditing(true)}>{t('l.editBtn')}</button>
          <button className="btn btn-small" onClick={() => setOpening(true)}>{t('l.obBtn')}</button>
          {labour.archived ? (
            <button className="btn btn-small" onClick={() => D.saveLabour({ ...labour, archived: false }, t('l.restored', { name: ln(labour) }))}>{t('l.restore')}</button>
          ) : (
            <button className="btn btn-small btn-danger-outline" onClick={archive}>{t('l.archiveBtn')}</button>
          )}
        </div>}
      </div>

      <PeriodPicker period={period} setPeriod={setPeriod} />
      <ReportTable section={report.sections[0]} />

      <button
        className="btn btn-wa full"
        onClick={() => openWhatsApp(labour.phone, khataText(labour, L, label))}
      >
        {t('l.wa')}{waNumber(labour.phone) ? '' : t('l.waPick')}
      </button>
      <DownloadBar getReport={() => report} />

      {editing && (
        <LabourForm
          title={t('l.formEdit')}
          initial={labour}
          onClose={() => setEditing(false)}
          onSave={(name, phone, extra) => {
            D.saveLabour({ ...labour, name, phone, ...extra });
            setEditing(false);
          }}
        />
      )}
      {opening && (
        <OpeningForm
          labour={labour}
          hasEntriesBefore={(d) => list.some((e) => e.d <= d)}
          onClose={() => setOpening(false)}
          onRemove={() => {
            const { ob, ...rest } = labour;
            D.saveLabour(rest, t('l.obRemoved'));
            setOpening(false);
          }}
          onSave={(ob) => {
            D.saveLabour({ ...labour, ob }, t('l.obSaved'));
            setOpening(false);
          }}
        />
      )}
    </div>
  );
}
