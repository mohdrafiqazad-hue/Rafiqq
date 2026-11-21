import { useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { balanceAt, fmtRs, pendingLists } from '../lib/calc.js';
import { openWhatsApp, remindText } from '../lib/whatsapp.js';
import { today } from '../lib/dates.js';
import Settings from './Settings.jsx';
import { t } from '../i18n/index.js';

export function LabourForm({ initial, onSave, onClose, title }) {
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    const p = phone.replace(/[^\d+]/g, '');
    if (!n) return setErr(t('l.errName'));
    if (p && p.replace(/\D/g, '').length < 10) return setErr(t('l.errPhone'));
    onSave(n, p);
  };
  return (
    <Sheet title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>{t('l.name')}</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('l.namePh')} maxLength={60} />
        </label>
        <label className="field">
          <span>{t('l.phone')}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" type="tel" placeholder="98765 43210" maxLength={16} />
        </label>
        {err && <div className="error-box">{err}</div>}
        <button className="btn btn-primary btn-big full" type="submit">{t('c.save')}</button>
      </form>
    </Sheet>
  );
}

/** Baaki paisa / cooler ke do highlighted dabbe (dabane par filter) */
export function PendingBoxes({ pending, filter, onPick }) {
  return (
    <div className="pend-boxes">
      <button className={`pend-box pend-money ${filter === 'paisa' ? 'on' : ''}`} onClick={() => onPick(filter === 'paisa' ? 'all' : 'paisa')}>
        <span className="pend-title">{t('pd.money')}</span>
        <b className="pend-val">{fmtRs(pending.totalMoney)}</b>
        <span className="pend-sub">{t('pd.count', { n: pending.money.length })}</span>
      </button>
      <button className={`pend-box pend-cooler ${filter === 'cooler' ? 'on' : ''}`} onClick={() => onPick(filter === 'cooler' ? 'all' : 'cooler')}>
        <span className="pend-title">{t('pd.cooler')}</span>
        <b className="pend-val">{pending.totalCooler}</b>
        <span className="pend-sub">{t('pd.count', { n: pending.cooler.length })}</span>
      </button>
    </div>
  );
}

export default function Labours({ setKhataId, showSettings, setShowSettings, filter = 'all', setFilter }) {
  const D = useData();
  const { confirm } = useUI();
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  if (showSettings) return <Settings onBack={() => setShowSettings(false)} />;

  const td = today();
  const pending = pendingLists(D.labours, D.entries, td);
  const card = (l, focus) => {
    const b = balanceAt(l, D.byLabour.get(l.id) || [], td);
    const owes = b.m > 0;
    const out = b.c > 0;
    return (
      <div key={l.id} className={`card labour-card ${focus === 'paisa' ? 'hl-money' : focus === 'cooler' ? 'hl-cooler' : owes ? 'edge-money' : ''}`}>
        <button className="labour-card-main" onClick={() => setKhataId(l.id)}>
          <div className="labour-card-text">
            <div className="labour-name">{l.name}{l.archived ? t('c.archivedSuffix') : ''}</div>
            <div className="muted small">{l.phone || t('l.noPhone')}</div>
          </div>
          <div className="labour-bal">
            <span className={`pill ${out ? 'pill-cool' : ''}`}>{b.c} {t('c.cooler')}</span>
            <span className={`pill ${owes ? 'pill-money' : b.m < 0 ? 'pill-neg' : ''}`}>{fmtRs(b.m)}</span>
          </div>
          <span className="chev">›</span>
        </button>
        {focus && (owes || out) && (
          <button className="btn btn-small btn-wa remind-btn" onClick={() => openWhatsApp(l.phone, remindText(l, b.c, b.m, td))}>
            🟢 {t('pd.remind')}
          </button>
        )}
      </div>
    );
  };

  const archived = D.labours.filter((l) => l.archived);
  const pickFilter = (f) => setFilter?.(f);
  const focusList = filter === 'paisa' ? pending.money : filter === 'cooler' ? pending.cooler : null;

  return (
    <div className="screen">
      <div className="row-actions">
        <button className="btn btn-primary btn-big grow" onClick={() => setAdding(true)}>{t('l.new')}</button>
        <button className="btn btn-big" onClick={() => setShowSettings(true)} aria-label={t('s.title')}>{t('l.settings')}</button>
      </div>

      <PendingBoxes pending={pending} filter={filter} onPick={pickFilter} />
      <p className="muted small note">{t('pd.asOf')}</p>

      {focusList ? (
        <>
          <button className="link-btn" onClick={() => pickFilter('all')}>‹ {t('pd.all')}</button>
          {!focusList.length && <div className="empty-card">{filter === 'paisa' ? t('pd.noneMoney') : t('pd.noneCooler')}</div>}
          {focusList.map((x) => card(x.labour, filter))}
        </>
      ) : (
        <>
          {!D.active.length && <div className="empty-card">{t('l.empty')}</div>}
          {D.active.map((l) => card(l, null))}
        </>
      )}

      {!focusList && archived.length > 0 && (
        <>
          <button className="link-btn archived-toggle" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? '▾' : '▸'} {t('l.archived', { n: archived.length })}
          </button>
          {showArchived && archived.map((l) => (
            <div key={l.id} className="archived-row">
              <button className="link-btn" onClick={() => setKhataId(l.id)}>{l.name}</button>
              {D.can.editLabour && <button
                className="btn btn-small"
                onClick={async () => {
                  if (await confirm({ title: t('l.restoreTitle'), message: t('l.restoreMsg', { name: l.name }), okText: t('c.yes') })) {
                    D.saveLabour({ ...l, archived: false }, t('l.restored', { name: l.name }));
                  }
                }}
              >
                {t('l.restore')}
              </button>}
            </div>
          ))}
        </>
      )}

      {adding && (
        <LabourForm
          title={t('l.formNew')}
          onClose={() => setAdding(false)}
          onSave={(name, phone) => {
            D.addLabour(name, phone);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
