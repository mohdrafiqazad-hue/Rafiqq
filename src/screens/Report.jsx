import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { DateBar, DownloadBar, MonthBar, ReportTable, Segmented, WeekBar, YearBar } from '../components/common.jsx';
import { buildDayReport, buildExpenseReport, buildLabourReport, buildMonthReport, buildWeekReport, buildYearReport, COMPANY } from '../lib/reports.js';
import { today, weekStart } from '../lib/dates.js';
import { t } from '../i18n/index.js';

export function PeriodPicker({ period, setPeriod, noFull }) {
  const opts = [['hafta', t('m.week')], ['mahina', t('m.month')], ['saal', t('m.year')]];
  if (!noFull) opts.push(['poora', t('m.full')]);
  return (
    <>
      <Segmented small value={period.mode} onChange={(mode) => setPeriod({ ...period, mode })} options={opts} />
      {period.mode === 'hafta' && <WeekBar ws={period.ws} onChange={(ws) => setPeriod({ ...period, ws })} />}
      {period.mode === 'mahina' && <MonthBar ym={period.ym} onChange={(ym) => setPeriod({ ...period, ym })} />}
      {period.mode === 'saal' && <YearBar year={period.year} onChange={(year) => setPeriod({ ...period, year })} />}
    </>
  );
}

export const defaultPeriod = () => ({ mode: 'mahina', ws: weekStart(today()), ym: today().slice(0, 7), year: Number(today().slice(0, 4)) });

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
  const [ws, setWs] = useState(weekStart(today()));
  const [ym, setYm] = useState(today().slice(0, 7));
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const [labourId, setLabourId] = useState(D.labours[0]?.id || '');
  const [period, setPeriod] = useState(defaultPeriod);
  const labour = D.labourById.get(labourId) || D.labours[0];

  const report = useMemo(() => {
    if (type === 'din') return buildDayReport(D.labours, D.entries, date);
    if (type === 'hafta') return buildWeekReport(D.labours, D.entries, ws);
    if (type === 'mahina') return buildMonthReport(D.labours, D.entries, ym);
    if (type === 'saal') return buildYearReport(D.labours, D.entries, year, D.expenses);
    if (type === 'kharcha') return buildExpenseReport(D.entries, D.expenses, D.xcats, period);
    return labour ? buildLabourReport(labour, D.entries, period) : null;
  }, [type, date, ws, ym, year, labour, period, D.labours, D.entries, D.expenses, D.xcats]);

  return (
    <div className="screen">
      <Segmented
        small
        value={type}
        onChange={setType}
        options={[['din', t('rep.din')], ['hafta', t('m.week')], ['mahina', t('m.month')], ['saal', t('m.year')], ['labour', t('rep.labour')], ['kharcha', t('rep.kharcha')]]}
      />

      {type === 'din' && <DateBar date={date} onChange={setDate} />}
      {type === 'hafta' && <WeekBar ws={ws} onChange={setWs} />}
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
