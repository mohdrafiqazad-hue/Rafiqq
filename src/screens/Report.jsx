import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { DateBar, DownloadBar, MonthBar, ReportTable, Segmented, YearBar } from '../components/common.jsx';
import { buildDayReport, buildExpenseReport, buildLabourReport, buildMonthReport, buildYearReport, COMPANY } from '../lib/reports.js';
import { today } from '../lib/dates.js';
import { t } from '../i18n/index.js';

export function PeriodPicker({ period, setPeriod, noFull }) {
  const opts = [['mahina', t('m.month')], ['saal', t('m.year')]];
  if (!noFull) opts.push(['poora', t('m.full')]);
  return (
    <>
      <Segmented small value={period.mode} onChange={(mode) => setPeriod({ ...period, mode })} options={opts} />
      {period.mode === 'mahina' && <MonthBar ym={period.ym} onChange={(ym) => setPeriod({ ...period, ym })} />}
      {period.mode === 'saal' && <YearBar year={period.year} onChange={(year) => setPeriod({ ...period, year })} />}
    </>
  );
}

export const defaultPeriod = () => ({ mode: 'mahina', ym: today().slice(0, 7), year: Number(today().slice(0, 4)) });

export function ReportHead({ report }) {
  return (
    <div className="card report-head">
      <div className="report-company">{COMPANY}</div>
      <div className="report-title">{report.title}</div>
      {report.subtitle && <div className="muted small">{report.subtitle}</div>}
    </div>
  );
}

export default function Report({ date, setDate }) {
  const D = useData();
  const [type, setType] = useState('mahina');
  const [ym, setYm] = useState(today().slice(0, 7));
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const [labourId, setLabourId] = useState(D.labours[0]?.id || '');
  const [period, setPeriod] = useState(defaultPeriod);
  const labour = D.labourById.get(labourId) || D.labours[0];

  const report = useMemo(() => {
    if (type === 'din') return buildDayReport(D.labours, D.entries, date);
    if (type === 'mahina') return buildMonthReport(D.labours, D.entries, ym);
    if (type === 'saal') return buildYearReport(D.labours, D.entries, year, D.expenses);
    if (type === 'kharcha') return buildExpenseReport(D.entries, D.expenses, D.xcats, period);
    return labour ? buildLabourReport(labour, D.entries, period) : null;
  }, [type, date, ym, year, labour, period, D.labours, D.entries, D.expenses, D.xcats]);

  return (
    <div className="screen">
      <Segmented
        small
        value={type}
        onChange={setType}
        options={[['din', t('rep.din')], ['mahina', t('m.month')], ['saal', t('m.year')], ['labour', t('rep.labour')], ['kharcha', t('rep.kharcha')]]}
      />

      {type === 'din' && <DateBar date={date} onChange={setDate} />}
      {type === 'mahina' && <MonthBar ym={ym} onChange={setYm} />}
      {type === 'saal' && <YearBar year={year} onChange={setYear} />}
      {type === 'labour' && (
        <>
          <select className="select" value={labour?.id || ''} onChange={(e) => setLabourId(e.target.value)} aria-label={t('rep.pickLabour')}>
            {D.labours.map((l) => <option key={l.id} value={l.id}>{l.name}{l.archived ? t('c.archivedSuffix') : ''}</option>)}
          </select>
          <PeriodPicker period={period} setPeriod={setPeriod} />
        </>
      )}
      {type === 'kharcha' && <PeriodPicker period={period} setPeriod={setPeriod} />}

      {report ? (
        <>
          <ReportHead report={report} />
          <DownloadBar getReport={() => report} />
          {report.sections.map((s, i) => <ReportTable key={i} section={s} />)}
        </>
      ) : (
        <div className="empty-card">{t('r.noLabour')}</div>
      )}
    </div>
  );
}
