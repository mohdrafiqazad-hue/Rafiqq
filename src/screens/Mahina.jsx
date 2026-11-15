import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { MonthBar, ReportTable, Segmented, Stat, YearBar } from '../components/common.jsx';
import { buildMonthReport, buildYearReport } from '../lib/reports.js';
import { fmtRs } from '../lib/calc.js';
import { today } from '../lib/dates.js';

function Totals({ tot }) {
  return (
    <div className="card">
      <div className="stats">
        <Stat label="Le gaye" value={tot[2]} />
        <Stat label="Wapis" value={tot[3]} />
        <Stat label="Lage" value={tot[4]} />
        <Stat label="Paisa bane" value={fmtRs(tot[5])} />
        <Stat label="Paisa mila" value={fmtRs(tot[6])} tone="green" />
      </div>
      <div className="kul-baaki">
        <span>Kul baaki (shuru se)</span>
        <b>{tot[7]} cooler · <span className={tot[8] < 0 ? 'neg' : ''}>{fmtRs(tot[8])}</span></b>
      </div>
    </div>
  );
}

export default function Mahina() {
  const D = useData();
  const [mode, setMode] = useState('mahina');
  const [ym, setYm] = useState(today().slice(0, 7));
  const [year, setYear] = useState(Number(today().slice(0, 4)));

  const report = useMemo(
    () => (mode === 'mahina' ? buildMonthReport(D.labours, D.entries, ym) : buildYearReport(D.labours, D.entries, year)),
    [mode, ym, year, D.labours, D.entries],
  );
  const labourSec = report.sections[report.sections.length - 1];

  return (
    <div className="screen">
      <Segmented value={mode} onChange={setMode} options={[['mahina', 'Mahina'], ['saal', 'Saal']]} />
      {mode === 'mahina' ? <MonthBar ym={ym} onChange={setYm} /> : <YearBar year={year} onChange={setYear} />}
      <Totals tot={labourSec.total} />
      <p className="muted small note">Cooler baaki / Paisa baaki = shuru se {mode === 'mahina' ? 'is mahine' : 'har mahine'} ke aakhir tak ka total.</p>
      {report.sections.map((s, i) => <ReportTable key={i} section={s} />)}
    </div>
  );
}
