import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { MonthBar, ReportTable, Segmented, Stat, WeekBar, YearBar } from '../components/common.jsx';
import { buildMonthReport, buildWeekReport, buildYearReport } from '../lib/reports.js';
import { fmtRs } from '../lib/calc.js';
import { monthEnd, monthStart, today, weekEnd, weekStart } from '../lib/dates.js';
import { expenseSummary } from '../lib/expenses.js';
import { t } from '../i18n/index.js';

function Totals({ tot, x }) {
  return (
    <div className="card">
      <div className="stats">
        <Stat label={t('col.t')} value={tot[2]} />
        <Stat label={t('col.r')} value={tot[3]} />
        <Stat label={t('col.p')} value={tot[4]} />
        <Stat label={t('col.bane')} value={fmtRs(tot[5])} />
        <Stat label={t('m.received')} value={fmtRs(tot[6])} tone="green" />
        <Stat label={t('m.kharcha')} value={fmtRs(x.kharcha)} tone="orange" />
      </div>
      <div className="kul-baaki">
        <span>{t('m.bachat')} ({t('m.received')} − {t('m.kharcha')})</span>
        <b className={x.bachat < 0 ? 'neg' : ''}>{fmtRs(x.bachat)}</b>
      </div>
      <div className="kul-baaki">
        <span>{t('m.kulBaaki')}</span>
        <b>{tot[7]} {t('c.cooler')} · <span className={tot[8] < 0 ? 'neg' : ''}>{fmtRs(tot[8])}</span></b>
      </div>
    </div>
  );
}

export default function Mahina() {
  const D = useData();
  const [mode, setMode] = useState('mahina');
  const [ws, setWs] = useState(weekStart(today()));
  const [ym, setYm] = useState(today().slice(0, 7));
  const [year, setYear] = useState(Number(today().slice(0, 4)));

  const report = useMemo(
    () => (mode === 'hafta'
      ? buildWeekReport(D.labours, D.entries, ws)
      : mode === 'mahina'
        ? buildMonthReport(D.labours, D.entries, ym)
        : buildYearReport(D.labours, D.entries, year, D.expenses)),
    [mode, ws, ym, year, D.labours, D.entries, D.expenses],
  );
  const x = useMemo(() => (mode === 'hafta'
    ? expenseSummary(D.entries, D.expenses, ws, weekEnd(ws))
    : mode === 'mahina'
      ? expenseSummary(D.entries, D.expenses, monthStart(ym), monthEnd(ym))
      : expenseSummary(D.entries, D.expenses, `${year}-01-01`, `${year}-12-31`)), [mode, ws, ym, year, D.entries, D.expenses]);
  // Labour-wise table: hafte me pehla section, saal me aakhri
  const labourSec = mode === 'hafta' ? report.sections[0] : report.sections[report.sections.length - 1];

  return (
    <div className="screen">
      <Segmented value={mode} onChange={setMode} options={[['hafta', t('m.week')], ['mahina', t('m.month')], ['saal', t('m.year')]]} />
      {mode === 'hafta' && <WeekBar ws={ws} onChange={setWs} />}
      {mode === 'mahina' && <MonthBar ym={ym} onChange={setYm} />}
      {mode === 'saal' && <YearBar year={year} onChange={setYear} />}
      <Totals tot={labourSec.total} x={x} />
      <p className="muted small note">{mode === 'hafta' ? t('m.noteWeek') : mode === 'mahina' ? t('m.noteMonth') : t('m.noteYear')}</p>
      {report.sections.map((s, i) => <ReportTable key={i} section={s} />)}
    </div>
  );
}
