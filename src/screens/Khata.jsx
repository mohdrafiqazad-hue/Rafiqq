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

function OpeningForm({ labour, onSave, onRemove, onClose, hasEntriesBefore }) {
  const [d, setD] = useState(labour.ob?.d || today());
  const [c, setC] = useState(labour.ob ? String(labour.ob.c) : '');
  const [m, setM] = useState(labour.ob ? String(labour.ob.m) : '');
  const [err, setErr] = useState('');
  return (
    <Sheet title="Pichla baaki (opening balance)" onClose={onClose}>
      <p className="muted small">
        Purane record ke liye: is date ke din ke ant tak labour ke paas kitne cooler aur kitna paisa baaki tha.
        Is date ke baad ka hisab isi baaki se aage chalega.
      </p>
      <label className="field">
        <span>Kis date tak ka baaki</span>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
      </label>
      <div className="grid2">
        <NumField label="Cooler baaki" value={c} onChange={setC} allowNegative />
        <NumField label="Paisa baaki (₹)" value={m} onChange={setM} allowNegative decimal />
      </div>
      {hasEntriesBefore(d) && (
        <div className="warn-box">Is date tak app me kuch entries hain. Woh is opening baaki me shaamil maani jayengi (dobara nahi judengi).</div>
      )}
      {err && <div className="error-box">{err}</div>}
      <div className="row-actions">
        {labour.ob && <button className="btn btn-danger-outline" onClick={onRemove}>Hatayein</button>}
        <button
          className="btn btn-primary btn-big grow"
          onClick={() => {
            if (!isValidISO(d)) return setErr('Sahi date chunein.');
            onSave({ d, c: Number(c) || 0, m: Number(m) || 0 });
          }}
        >
          ✓ Save
        </button>
      </div>
    </Sheet>
  );
}

export default function Khata({ labour, onBack }) {
  const D = useData();
  const { confirm } = useUI();
  const [period, setPeriod] = useState(defaultPeriod);
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
      title: `${labour.name} ko list se hatayein?`,
      message: 'Labour Entry list se hat jayega, lekin uska purana hisab reports me rahega. Baad me "Wapis laayein" kar sakte hain.',
      okText: 'Haan, hatayein',
      danger: true,
    });
    if (ok) {
      D.saveLabour({ ...labour, archived: true }, `${labour.name} list se hata diya`);
      back();
    }
  };

  return (
    <div className="screen">
      <div className="subhead">
        <button className="btn btn-small" onClick={back}>‹ Wapis</button>
        <div className="subhead-title">{labour.name}{labour.archived ? ' (hataya)' : ''}</div>
      </div>

      <div className="card">
        <div className="muted small">{labour.phone ? `📞 ${labour.phone}` : 'Phone number nahi hai'}</div>
        <div className="kul-baaki big">
          <span>Abhi kul baaki</span>
          <b>{now.c} cooler · <span className={now.m < 0 ? 'neg' : ''}>{fmtRs(now.m)}</span></b>
        </div>
        {labour.ob && (
          <div className="muted small">Opening baaki: {fmtDate(labour.ob.d)} tak {labour.ob.c} cooler · {fmtRs(labour.ob.m)}</div>
        )}
        <div className="btn-wrap">
          <button className="btn btn-small" onClick={() => setEditing(true)}>✎ Naam/Phone</button>
          <button className="btn btn-small" onClick={() => setOpening(true)}>Pichla baaki</button>
          {labour.archived ? (
            <button className="btn btn-small" onClick={() => D.saveLabour({ ...labour, archived: false }, `${labour.name} wapis aa gaya ✓`)}>Wapis laayein</button>
          ) : (
            <button className="btn btn-small btn-danger-outline" onClick={archive}>List se hatayein</button>
          )}
        </div>
      </div>

      <PeriodPicker period={period} setPeriod={setPeriod} />
      <ReportTable section={report.sections[0]} />

      <button
        className="btn btn-wa full"
        onClick={() => openWhatsApp(labour.phone, khataText(labour, L, label))}
      >
        🟢 WhatsApp pe hisab bhejein{waNumber(labour.phone) ? '' : ' (number chunein)'}
      </button>
      <DownloadBar getReport={() => report} />

      {editing && (
        <LabourForm
          title="Naam / Phone badlein"
          initial={labour}
          onClose={() => setEditing(false)}
          onSave={(name, phone) => {
            D.saveLabour({ ...labour, name, phone });
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
            D.saveLabour(rest, 'Opening baaki hata diya');
            setOpening(false);
          }}
          onSave={(ob) => {
            D.saveLabour({ ...labour, ob }, 'Pichla baaki save ho gaya ✓');
            setOpening(false);
          }}
        />
      )}
    </div>
  );
}
