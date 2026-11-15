import { useRef, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { NumField } from '../components/common.jsx';
import { buildBackup, parseBackup, planImport } from '../lib/backup.js';
import { fmtRs } from '../lib/calc.js';
import { fmtDateTime, today } from '../lib/dates.js';
import { downloadFile } from '../export/index.js';

export default function Settings({ onBack }) {
  const D = useData();
  const { toast, confirm } = useUI();
  const [rate, setRate] = useState(String(D.rate));
  const [plan, setPlan] = useState(null);
  const [useFileRate, setUseFileRate] = useState(false);
  const fileRef = useRef(null);

  const saveRate = async () => {
    const r = Number(rate);
    if (!(r > 0)) return toast('Rate 0 se zyada hona chahiye.', 'err');
    if (r === D.rate) return toast('Rate pehle se yahi hai.');
    const ok = await confirm({
      title: 'Rate badlein?',
      message: `Naya rate ${fmtRs(r)} per cooler. Ye sirf nayi entries par lagega, purani entries apne rate par rahengi.`,
      okText: 'Haan, badlein',
    });
    if (ok) D.setRate(r);
  };

  const backup = () => {
    const data = buildBackup({ rate: D.rate, labours: D.labours, entries: D.entries });
    const file = new File([JSON.stringify(data, null, 1)], `MGM_backup_${today()}.json`, { type: 'application/json' });
    downloadFile(file);
    toast(`Backup download ho gaya (${D.labours.length} labour, ${D.entries.length} entries) ✓`);
  };

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const incoming = parseBackup(await f.text());
      const p = planImport({ labours: D.labours, entries: D.entries }, incoming);
      setUseFileRate(false);
      setPlan({ ...p, incoming, fileName: f.name });
    } catch (err) {
      toast(err.message, 'err', 6000);
    }
  };

  const doImport = () => {
    const { incoming } = plan;
    D.importData({
      labours: incoming.labours,
      entries: incoming.entries,
      rate: useFileRate && incoming.rate ? incoming.rate : null,
    });
    setPlan(null);
  };

  return (
    <div className="screen">
      <div className="subhead">
        <button className="btn btn-small" onClick={onBack}>‹ Wapis</button>
        <div className="subhead-title">Settings</div>
      </div>

      <div className="card">
        <div className="card-title">Rate per cooler</div>
        <div className="rate-row">
          <NumField label={`Abhi ka rate: ${fmtRs(D.rate)}`} value={rate} onChange={setRate} decimal onEnter={saveRate} />
          <button className="btn btn-primary" onClick={saveRate}>Save</button>
        </div>
        <p className="muted small">Rate badalne se purani entries nahi badalti; har entry me us din ka rate save hota hai.</p>
      </div>

      <div className="card">
        <div className="card-title">Backup</div>
        <button className="btn full" onClick={backup}>⬇ Backup download karein (JSON)</button>
        <button className="btn full" onClick={() => fileRef.current?.click()}>⬆ Backup / purane app ka data laayein</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={pickFile} />
        <p className="muted small">Hafte me ek baar backup download karke WhatsApp/Drive par rakh lein.</p>
      </div>

      <div className="card">
        <div className="card-title">Account</div>
        {D.storeKind === 'local' ? (
          <p className="warn-box">Demo mode: data sirf is phone me hai, kahin sync nahi hota.</p>
        ) : (
          <p className="small">Login: <b>{D.user?.email}</b><br />
            <span className="muted">{D.online ? (D.pending ? 'Sync ho raha hai…' : 'Sab data sync hai ✓') : 'Offline: data phone me save hai, net aate hi sync hoga'}</span>
          </p>
        )}
        <button
          className="btn btn-danger-outline full"
          onClick={async () => {
            const msg = D.storeKind === 'firebase' && D.pending
              ? 'Kuch data abhi sync nahi hua hai! Logout karne se woh kho sakta hai. Pehle internet chalu karke sync hone dein.'
              : 'Kya aap logout karna chahte hain?';
            if (await confirm({ title: 'Logout', message: msg, okText: 'Logout', danger: true })) D.logout();
          }}
        >
          Logout
        </button>
      </div>

      <p className="muted small center">Madhur Ganga Minerals · Cooler Hisab v1.0</p>

      {plan && (
        <Sheet title="Data laayein?" onClose={() => setPlan(null)}>
          <p className="small muted">File: {plan.fileName}{plan.incoming.exportedAt ? ` · ${fmtDateTime(new Date(plan.incoming.exportedAt))}` : ''}</p>
          <div className="plan">
            <div><b>{plan.labourCount}</b> labour <span className="muted">({plan.newLabours} naye, {plan.updatedLabours} pehle se)</span></div>
            <div><b>{plan.entryCount}</b> entries <span className="muted">({plan.newEntries} nayi, {plan.replacedEntries} badlengi)</span></div>
            {plan.skipped > 0 && <div className="warn-box">{plan.skipped} entries galat thi (labour/date nahi mila), unhe chhod diya jayega.</div>}
          </div>
          {plan.replacedEntries > 0 && (
            <p className="small">Jis labour + date ki entry pehle se hai, wahan <b>file wali entry</b> rakhi jayegi.</p>
          )}
          {plan.rate && plan.rate !== D.rate && (
            <label className="check">
              <input type="checkbox" checked={useFileRate} onChange={(e) => setUseFileRate(e.target.checked)} />
              File wala rate {fmtRs(plan.rate)} bhi lagaayein (abhi {fmtRs(D.rate)})
            </label>
          )}
          <div className="row-actions">
            <button className="btn" onClick={() => setPlan(null)}>Nahi</button>
            <button className="btn btn-primary btn-big grow" onClick={doImport}>✓ Haan, data daalein</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
