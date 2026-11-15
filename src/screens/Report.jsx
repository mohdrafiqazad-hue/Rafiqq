import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { DateBar, DownloadBar, MonthBar, ReportTable, Segmented, YearBar } from '../components/common.jsx';
import { buildDayReport, buildLabourReport, buildMonthReport, buildYearReport } from '../lib/reports.js';
import { today } from '../lib/dates.js';

export function PeriodPicker({ period, setPeriod }) {
  return (
    <>
      <Segmented
        small
        value={period.mode}
        onChange={(mode) => setPeriod({ ...period, mode })}
        options={[['mahina', 'Mahina'], ['saal', 'Saal'], ['poora', 'Poora']]}
      />
      {period.mode === 'mahina' && <MonthBar ym={period.ym} onChange={(ym) => setPeriod({ ...period, ym })} />}
      {period.mode === 'saal' && <YearBar year={period.year} onChange={(year) => setPeriod({ ...period, year })} />}
    </>
  );
}

export const defaultPeriod = () => ({ mode: 'mahina', ym: today().slice(0, 7), year: Number(today().slice(0, 4)) });

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
    if (type === 'saal') return buildYearReport(D.labours, D.entries, year);
    return labour ? buildLabourReport(labour, D.entries, period) : null;
  }, [type, date, ym, year, labour, period, D.labours, D.entries]);

  return (
    <div className="screen">
      <Segmented value={type} onChange={setType} options={[['din', 'Din'], ['mahina', 'Mahina'], ['saal', 'Saal'], ['labour', 'Labour']]} />

      {type === 'din' && <DateBar date={date} onChange={setDate} />}
      {type === 'mahina' && <MonthBar ym={ym} onChange={setYm} />}
      {type === 'saal' && <YearBar year={year} onChange={setYear} />}
      {type === 'labour' && (
        <>
          <select className="select" value={labour?.id || ''} onChange={(e) => setLabourId(e.target.value)} aria-label="Labour chunein">
            {D.labours.map((l) => <option key={l.id} value={l.id}>{l.name}{l.archived ? ' (hataya)' : ''}</option>)}
          </select>
          <PeriodPicker period={period} setPeriod={setPeriod} />
        </>
      )}

      {report ? (
        <>
          <div className="card report-head">
            <div className="report-company">Madhur Ganga Minerals</div>
            <div className="report-title">{report.title}</div>
            {report.subtitle && <div className="muted small">{report.subtitle}</div>}
          </div>
          <DownloadBar getReport={() => report} />
          {report.sections.map((s, i) => <ReportTable key={i} section={s} />)}
        </>
      ) : (
        <div className="empty-card">Koi labour nahi hai.</div>
      )}
    </div>
  );
}
