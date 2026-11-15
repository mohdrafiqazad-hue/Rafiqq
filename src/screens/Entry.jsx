import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { useUI } from '../components/ui.jsx';
import { DateBar, NumField } from '../components/common.jsx';
import { balanceBefore, fmtRs, nextPendingLabour, parchi } from '../lib/calc.js';
import { addDays, fmtDate } from '../lib/dates.js';

const EMPTY = { t: '', r: '', p: '', m: '' };
const toForm = (e) => (e ? { t: String(e.t ?? ''), r: String(e.r ?? ''), p: String(e.p ?? ''), m: String(e.m ?? '') } : EMPTY);

export default function Entry({ date, setDate, labourId, setLabourId, goTab }) {
  const D = useData();
  const { confirm, toast } = useUI();
  const [form, setForm] = useState(EMPTY);
  const firstRef = useRef(null);
  const focusNext = useRef(false);

  const doneIds = useMemo(
    () => new Set(D.labours.filter((l) => D.getEntry(l.id, date)).map((l) => l.id)),
    [D, date],
  );

  // Chips me active labour + archived jinki is din entry hai
  const chips = D.labours.filter((l) => !l.archived || doneIds.has(l.id));
  const labour = D.labourById.get(labourId) || null;

  // Labour chuna nahi hai to pehla bacha hua labour chuno
  useEffect(() => {
    if ((!labour || (labour.archived && !doneIds.has(labour.id))) && D.active.length) {
      setLabourId(D.active.find((l) => !doneIds.has(l.id))?.id || D.active[0].id);
    }
  }, [labour, D.active, doneIds, setLabourId]);

  const existing = labour ? D.getEntry(labour.id, date) : null;
  const existingSig = existing ? JSON.stringify(existing) : '';

  // Labour ya date badle to form bharo
  useEffect(() => {
    setForm(toForm(existing));
    if (focusNext.current) {
      focusNext.current = false;
      setTimeout(() => firstRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labourId, date, existingSig]);

  if (!D.labours.length || !D.active.length && !chips.length) {
    return (
      <div className="screen">
        <DateBar date={date} onChange={setDate} />
        <div className="empty-card">
          <p>Abhi koi labour nahi hai.</p>
          <p className="muted">Pehle Labour tab me labour jodein, ya Settings se purane app ka backup laayein.</p>
          <button className="btn btn-primary" onClick={() => goTab('labour')}>+ Labour jodein</button>
        </div>
      </div>
    );
  }

  const list = labour ? D.byLabour.get(labour.id) || [] : [];
  const prev = labour ? balanceBefore(labour, list, date) : { c: 0, m: 0 };
  const rate = existing ? existing.k : D.rate;
  const P = parchi(prev, form, rate);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const anyValue = ['t', 'r', 'p', 'm'].some((k) => form[k] !== '' && Number(form[k]) !== 0);

  const save = async () => {
    if (!labour) return;
    if (!anyValue && !existing) {
      const ok = await confirm({
        title: 'Sab khaali hai',
        message: `${labour.name} ki ${fmtDate(date)} ki entry 0 ke saath save karein? (Matlab us din kuch nahi hua)`,
        okText: 'Haan, save karein',
      });
      if (!ok) return;
    }
    if (P.tooManyReturned) {
      const ok = await confirm({
        title: 'Dhyan dein',
        message: `Wapis aaye (${P.r}) pichle baaki + le gaye (${P.prevC + P.t}) se zyada hain. Phir bhi save karein?`,
        okText: 'Phir bhi save',
      });
      if (!ok) return;
    }
    const e = { l: labour.id, d: date, t: P.t, r: P.r, p: P.p, m: P.mila, k: Number(rate) || 0 };
    D.saveEntry(e, !!existing);
    if (existing) return; // update ke baad wahi labour rahe

    const done = new Set(doneIds);
    done.add(labour.id);
    const next = nextPendingLabour(D.active, done, labour.id);
    focusNext.current = true;
    if (next) setLabourId(next);
    else {
      const nd = addDays(date, 1);
      toast(`${fmtDate(date)} ke sab labour ho gaye. Ab ${fmtDate(nd)}`, 'ok', 3500);
      setDate(nd);
      setLabourId(D.active[0]?.id || null);
    }
  };

  const del = async () => {
    const ok = await confirm({
      title: 'Entry delete karein?',
      message: `${labour.name} ki ${fmtDate(date)} wali entry hamesha ke liye hat jayegi.`,
      okText: 'Haan, delete',
      danger: true,
    });
    if (!ok) return;
    const ok2 = await confirm({
      title: 'Pakka?',
      message: 'Dobara confirm karein: ye entry delete ho jayegi.',
      okText: 'Delete karein',
      danger: true,
    });
    if (ok2) D.deleteEntry(labour.id, date);
  };

  return (
    <div className="screen">
      <DateBar date={date} onChange={setDate} />

      <div className="chips" role="listbox" aria-label="Labour chunein">
        {chips.map((l) => (
          <button
            key={l.id}
            role="option"
            aria-selected={l.id === labourId}
            className={`chip ${l.id === labourId ? 'on' : ''}`}
            onClick={() => setLabourId(l.id)}
          >
            {doneIds.has(l.id) && <span className="dot" aria-label="entry ho gayi" />}
            {l.name}
          </button>
        ))}
      </div>
      <div className="chips-info muted">
        {doneIds.size}/{D.active.length} labour ki entry ho gayi
      </div>

      {labour && (
        <div className="card entry-card">
          <div className="entry-head">
            <div>
              <div className="entry-name">{labour.name}</div>
              <div className="muted small">Pichla baaki: {prev.c} cooler · {fmtRs(prev.m)}</div>
            </div>
            {existing ? <span className="pill pill-green">Entry bani hai</span> : <span className="pill">Nayi entry</span>}
          </div>

          <div className="grid2">
            <NumField label="Cooler le gaye" value={form.t} onChange={set('t')} inputRef={firstRef} />
            <NumField label="Wapis aaye" value={form.r} onChange={set('r')} />
            <NumField label="Market me lage" value={form.p} onChange={set('p')} />
            <NumField label="Paisa mila (₹)" value={form.m} onChange={set('m')} onEnter={save} />
          </div>

          {P.tooManyReturned && (
            <div className="warn-box">
              ⚠️ Wapis aaye ({P.r}) zyada hain! Pichla baaki {P.prevC} + le gaye {P.t} = sirf {P.prevC + P.t} cooler the.
            </div>
          )}

          <div className="parchi" aria-label="Parchi">
            <div className="parchi-title">Parchi</div>
            <div className="prow"><span>Pichla baaki</span><b>{P.prevC}</b></div>
            <div className="prow"><span>+ Aaj le gaye</span><b>{P.t}</b></div>
            <div className="prow"><span>− Wapis aaye</span><b>{P.r}</b></div>
            <div className="prow ptotal"><span>= Market me baaki cooler</span><b className={P.coolerBaaki < 0 ? 'neg' : ''}>{P.coolerBaaki}</b></div>
            <div className="psep" />
            <div className="prow"><span>Lage {P.p} × {fmtRs(P.k)}</span><b>{fmtRs(P.paisaBane)}</b></div>
            <div className="prow"><span>+ Pichla paisa baaki</span><b>{fmtRs(P.prevM)}</b></div>
            <div className="prow"><span>− Paisa mila</span><b>{fmtRs(P.mila)}</b></div>
            <div className="prow ptotal"><span>= Kul paisa baaki</span><b className={P.kulPaisaBaaki < 0 ? 'neg' : ''}>{fmtRs(P.kulPaisaBaaki)}</b></div>
            {existing && Number(existing.k) !== Number(D.rate) && (
              <div className="muted small">Is entry ka rate {fmtRs(existing.k)} hai (us din ka). Abhi ka rate {fmtRs(D.rate)}.</div>
            )}
          </div>

          {existing ? (
            <div className="row-actions">
              <button className="btn btn-danger-outline" onClick={del}>🗑 Delete</button>
              <button className="btn btn-primary btn-big grow" onClick={save}>✓ Update</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-big full" onClick={save}>✓ Save</button>
          )}
        </div>
      )}
    </div>
  );
}
