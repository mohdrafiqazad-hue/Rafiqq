// Company ke kharche: diesel, service, salary, driver, aur apni category
import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { DownloadBar, NumField, Stat } from '../components/common.jsx';
import { PeriodPicker, defaultPeriod } from './Report.jsx';
import { fmtRs } from '../lib/calc.js';
import { fmtDate, fmtDateLong, isValidISO, today } from '../lib/dates.js';
import { allCategories, catIcon, catName, expenseSummary, newCatId } from '../lib/expenses.js';
import { buildExpenseReport, periodRange } from '../lib/reports.js';
import { t } from '../i18n/index.js';

function ExpenseForm({ initial, onClose }) {
  const D = useData();
  const { confirm } = useUI();
  const [d, setD] = useState(initial?.d || today());
  const [c, setC] = useState(initial?.c || 'diesel');
  const [a, setA] = useState(initial ? String(initial.a) : '');
  const [p, setP] = useState(initial?.p || '');
  const [n, setN] = useState(initial?.n || '');
  const [err, setErr] = useState('');
  const cats = allCategories(D.xcats);
  const readOnly = !!initial && !D.can.editKharcha; // purana kharcha: sirf malik badal sakta hai

  const save = () => {
    if (readOnly) return;
    if (!isValidISO(d)) return setErr(t('x.errDate'));
    const amt = Number(a);
    if (!(amt > 0)) return setErr(t('x.errAmount'));
    const x = { ...(initial?.id ? { id: initial.id } : {}), d, c, a: Math.round(amt * 100) / 100, p: p.trim(), n: n.trim() };
    D.saveExpense(x, initial?.d);
    onClose();
  };

  const del = async () => {
    const ok = await confirm({
      title: t('x.delTitle'),
      message: t('x.delMsg', { cat: catName(initial.c, D.xcats), amt: fmtRs(initial.a), date: fmtDate(initial.d) }),
      okText: t('e.delOk'),
      danger: true,
    });
    if (ok) {
      D.deleteExpense(initial);
      onClose();
    }
  };

  return (
    <Sheet title={readOnly ? t('x.view') : initial ? t('x.formEdit') : t('x.formNew')} onClose={onClose}>
      <fieldset className="plain-fieldset" disabled={readOnly}>
      <label className="field">
        <span>{t('x.date')}</span>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
      </label>
      <div className="field">
        <span>{t('x.category')}</span>
        <div className="chips">
          {cats.map((cat) => (
            <button key={cat.id} type="button" className={`chip ${c === cat.id ? 'on' : ''}`} onClick={() => setC(cat.id)}>
              {catIcon(cat.id)} {catName(cat.id, D.xcats)}
            </button>
          ))}
        </div>
      </div>
      <NumField label={t('x.amount')} value={a} onChange={setA} decimal />
      <label className="field">
        <span>{t('x.payee')}</span>
        <input value={p} onChange={(e) => setP(e.target.value)} placeholder={t('x.payeePh')} maxLength={60} />
      </label>
      <label className="field">
        <span>{t('x.note')}</span>
        <input value={n} onChange={(e) => setN(e.target.value)} placeholder={t('x.notePh')} maxLength={120} />
      </label>
      </fieldset>
      {err && <div className="error-box">{err}</div>}
      {readOnly ? (
        <div className="lock-box">{t('pm.lockedX')}</div>
      ) : (
        <div className="row-actions">
          {initial && <button className="btn btn-danger-outline" onClick={del}>{t('c.delete')}</button>}
          <button className="btn btn-primary btn-big grow" onClick={save}>{t('c.save')}</button>
        </div>
      )}
    </Sheet>
  );
}

function CategorySheet({ onClose }) {
  const D = useData();
  const { toast } = useUI();
  const [name, setName] = useState('');
  const cats = allCategories(D.xcats);
  const add = () => {
    const nm = name.trim();
    if (!nm) return;
    if (cats.some((c) => catName(c.id, D.xcats).toLowerCase() === nm.toLowerCase())) {
      toast(t('x.catExists'), 'err');
      return;
    }
    D.setCategories([...D.xcats, { id: newCatId(nm, D.xcats), name: nm }]);
    setName('');
  };
  const remove = (id) => {
    if (D.expenses.some((x) => x.c === id)) {
      toast(t('x.catUsed'), 'err', 5000);
      return;
    }
    D.setCategories(D.xcats.filter((c) => c.id !== id));
  };
  return (
    <Sheet title={t('x.catTitle')} onClose={onClose}>
      <p className="muted small">{t('x.catHelp')}</p>
      <div className="cat-add">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('x.catNew')}
          maxLength={40}
          aria-label={t('x.catNew')}
        />
        <button className="btn btn-primary" onClick={add}>{t('x.catAdd')}</button>
      </div>
      <div className="cat-list">
        {cats.map((c) => (
          <div key={c.id} className="cat-item">
            <span>{catIcon(c.id)} {catName(c.id, D.xcats)}</span>
            {c.builtin
              ? <span className="muted small">{t('x.catBuiltin')}</span>
              : <button className="icon-btn" onClick={() => remove(c.id)} aria-label={t('l.obRemove')}>🗑</button>}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export default function Kharcha() {
  const D = useData();
  const [period, setPeriod] = useState(defaultPeriod);
  const [form, setForm] = useState(null); // null | 'new' | expense
  const [cats, setCats] = useState(false);
  const { from, to } = periodRange(period);
  const s = useMemo(() => expenseSummary(D.entries, D.expenses, from, to), [D.entries, D.expenses, from, to]);
  const report = useMemo(() => buildExpenseReport(D.entries, D.expenses, D.xcats, period), [D.entries, D.expenses, D.xcats, period]);

  // Date ke hisab se group (nayi date upar)
  const groups = useMemo(() => {
    const m = new Map();
    for (const x of [...s.list].reverse()) {
      if (!m.has(x.d)) m.set(x.d, []);
      m.get(x.d).push(x);
    }
    return [...m.entries()];
  }, [s.list]);
  const maxCat = s.cats[0]?.total || 1;

  return (
    <div className="screen">
      <div className="row-actions">
        <button className="btn btn-primary btn-big grow" onClick={() => setForm('new')}>{t('x.add')}</button>
        {D.can.editKharcha && <button className="btn btn-big" onClick={() => setCats(true)}>{t('x.manage')}</button>}
      </div>

      <PeriodPicker period={period} setPeriod={setPeriod} />

      <div className="card">
        <div className="stats stats-3">
          <Stat label={t('x.total')} value={fmtRs(s.kharcha)} tone="orange" />
          <Stat label={t('x.received')} value={fmtRs(s.mila)} tone="green" />
          <Stat label={t('x.bachat')} value={fmtRs(s.bachat)} tone={s.bachat < 0 ? 'red' : 'green'} />
        </div>
        {s.cats.length > 0 && (
          <div className="catbars">
            {s.cats.map((c) => (
              <div key={c.id} className="catbar">
                <div className="catbar-top">
                  <span>{catIcon(c.id)} {catName(c.id, D.xcats)} <span className="muted small">· {t('x.count', { n: c.count })}</span></span>
                  <b>{fmtRs(c.total)}</b>
                </div>
                <div className="catbar-track"><div className="catbar-fill" style={{ width: `${Math.max(3, (c.total / maxCat) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!s.list.length && <div className="empty-card">{t('x.none')}</div>}

      {groups.map(([d, list]) => (
        <div key={d} className="card xgroup">
          <div className="xgroup-head">
            <span>{fmtDateLong(d)}</span>
            <b>{fmtRs(list.reduce((sum, x) => sum + Number(x.a), 0))}</b>
          </div>
          {list.map((x) => (
            <button key={x.id} className="xrow" onClick={() => setForm(x)}>
              <span className="xrow-icon">{catIcon(x.c)}</span>
              <span className="xrow-main">
                <span className="xrow-cat">{catName(x.c, D.xcats)}</span>
                {(x.p || x.n) && <span className="muted small">{[x.p, x.n].filter(Boolean).join(' · ')}</span>}
              </span>
              <b className="xrow-amt">{fmtRs(x.a)}</b>
            </button>
          ))}
        </div>
      ))}

      {s.list.length > 0 && <DownloadBar getReport={() => report} />}

      {form && <ExpenseForm initial={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {cats && <CategorySheet onClose={() => setCats(false)} />}
    </div>
  );
}
