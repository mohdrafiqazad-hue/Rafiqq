import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { useUI } from '../components/ui.jsx';
import { DateBar, MonthCalendar, NumField } from '../components/common.jsx';
import { balanceBefore, fmtRs, nextPendingLabour, parchi } from '../lib/calc.js';
import { addDays, fmtDate } from '../lib/dates.js';
import { t } from '../i18n/index.js';
import { ln } from '../lib/translit.js';

const EMPTY = { t: '', r: '', p: '', m: '' };
const toForm = (e) => (e ? { t: String(e.t ?? ''), r: String(e.r ?? ''), p: String(e.p ?? ''), m: String(e.m ?? '') } : EMPTY);

export default function Entry({ date, setDate, labourId, setLabourId, goTab }) {
  const D = useData();
  const { confirm, toast } = useUI();
  const [form, setForm] = useState(EMPTY);
  const firstRef = useRef(null);
  const focusNext = useRef(false);

  // Calendar: kis din sab ki entry hui (hara), kis din kuch baaki (narangi)
  const [showCal, setShowCal] = useState(() => {
    try { return localStorage.getItem('mgm-cal') !== '0'; } catch { return true; }
  });
  const toggleCal = () => {
    setShowCal((v) => {
      try { localStorage.setItem('mgm-cal', v ? '0' : '1'); } catch { /* ignore */ }
      return !v;
    });
  };
  const marks = useMemo(() => {
    const activeIds = new Set(D.active.map((l) => l.id));
    const count = new Map();
    for (const e of D.entries) if (activeIds.has(e.l)) count.set(e.d, (count.get(e.d) || 0) + 1);
    const m = new Map();
    for (const [d, n] of count) m.set(d, n >= activeIds.size ? 'full' : 'part');
    return m;
  }, [D.entries, D.active]);

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
          <p>{t('e.noLabour')}</p>
          <p className="muted">{t('e.noLabourHint')}</p>
          <button className="btn btn-primary" onClick={() => goTab('labour')}>{t('e.addLabour')}</button>
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

  const locked = !!existing && !D.can.editEntry; // purani entry: sirf malik badal sakta hai

  const save = async () => {
    if (!labour || locked) return;
    if (!anyValue && !existing) {
      const ok = await confirm({
        title: t('e.emptyTitle'),
        message: t('e.emptyMsg', { name: ln(labour), date: fmtDate(date) }),
        okText: t('e.emptyOk'),
      });
      if (!ok) return;
    }
    if (P.tooManyReturned) {
      const ok = await confirm({
        title: t('e.tooManyTitle'),
        message: t('e.tooManyMsg', { r: P.r, sum: P.prevC + P.t }),
        okText: t('e.tooManyOk'),
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
      toast(t('e.allDone', { date: fmtDate(date), next: fmtDate(nd) }), 'ok', 3500);
      setDate(nd);
      setLabourId(D.active[0]?.id || null);
    }
  };

  const del = async () => {
    const ok = await confirm({
      title: t('e.delTitle'),
      message: t('e.delMsg', { name: ln(labour), date: fmtDate(date) }),
      okText: t('e.delOk'),
      danger: true,
    });
    if (!ok) return;
    const ok2 = await confirm({
      title: t('e.del2Title'),
      message: t('e.del2Msg'),
      okText: t('e.del2Ok'),
      danger: true,
    });
    if (ok2) D.deleteEntry(labour.id, date);
  };

  return (
    <div className="screen">
      <DateBar date={date} onChange={setDate} />
      <button className="link-btn cal-toggle" onClick={toggleCal}>{showCal ? `▾ ${t('cal.hide')}` : t('cal.show')}</button>
      {showCal && <MonthCalendar date={date} onPick={setDate} marks={marks} />}
      {showCal && !D.can.editEntry && <p className="muted small note">{t('cal.note')}</p>}

      <div className="chips" role="listbox" aria-label={t('e.pickLabour')}>
        {chips.map((l) => (
          <button
            key={l.id}
            role="option"
            aria-selected={l.id === labourId}
            className={`chip ${l.id === labourId ? 'on' : ''}`}
            onClick={() => setLabourId(l.id)}
          >
            {doneIds.has(l.id) && <span className="dot" aria-label={t('e.doneDot')} />}
            {ln(l)}
          </button>
        ))}
      </div>
      <div className="chips-info muted">
        {t('e.progress', { done: doneIds.size, total: D.active.length })}
      </div>

      {labour && (
        <div className="card entry-card">
          <div className="entry-head">
            <div>
              <div className="entry-name">{ln(labour)}</div>
              <div className="muted small">{t('e.prev', { c: prev.c, m: fmtRs(prev.m) })}</div>
            </div>
            {existing ? <span className="pill pill-green">{t('e.exists')}</span> : <span className="pill">{t('e.new')}</span>}
          </div>

          <div className="grid2">
            <NumField label={t('e.t')} value={form.t} onChange={set('t')} inputRef={firstRef} disabled={locked} />
            <NumField label={t('e.r')} value={form.r} onChange={set('r')} disabled={locked} />
            <NumField label={t('e.p')} value={form.p} onChange={set('p')} disabled={locked} />
            <NumField label={t('e.m')} value={form.m} onChange={set('m')} onEnter={save} disabled={locked} />
          </div>

          {P.tooManyReturned && (
            <div className="warn-box">
              {t('e.warn', { r: P.r, prev: P.prevC, t: P.t, sum: P.prevC + P.t })}
            </div>
          )}

          <div className="parchi" aria-label={t('e.parchi')}>
            <div className="parchi-title">{t('e.parchi')}</div>
            <div className="prow"><span>{t('e.pPrev')}</span><b>{P.prevC}</b></div>
            <div className="prow"><span>{t('e.pTaken')}</span><b>{P.t}</b></div>
            <div className="prow"><span>{t('e.pRet')}</span><b>{P.r}</b></div>
            <div className="prow ptotal"><span>{t('e.pCool')}</span><b className={P.coolerBaaki < 0 ? 'neg' : ''}>{P.coolerBaaki}</b></div>
            <div className="psep" />
            <div className="prow"><span>{t('e.pLage', { p: P.p, k: fmtRs(P.k) })}</span><b>{fmtRs(P.paisaBane)}</b></div>
            <div className="prow"><span>{t('e.pPrevM')}</span><b>{fmtRs(P.prevM)}</b></div>
            <div className="prow"><span>{t('e.pMila')}</span><b>{fmtRs(P.mila)}</b></div>
            <div className="prow ptotal"><span>{t('e.pTotal')}</span><b className={P.kulPaisaBaaki < 0 ? 'neg' : ''}>{fmtRs(P.kulPaisaBaaki)}</b></div>
            {existing && Number(existing.k) !== Number(D.rate) && (
              <div className="muted small">{t('e.rateNote', { k: fmtRs(existing.k), now: fmtRs(D.rate) })}</div>
            )}
          </div>

          {locked ? (
            <div className="lock-box">{t('pm.locked')}</div>
          ) : existing ? (
            <div className="row-actions">
              <button className="btn btn-danger-outline" onClick={del}>{t('c.delete')}</button>
              <button className="btn btn-primary btn-big grow" onClick={save}>{t('c.update')}</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-big full" onClick={save}>{t('c.save')}</button>
          )}
        </div>
      )}
    </div>
  );
}
