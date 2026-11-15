import { useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { balanceAt, fmtRs } from '../lib/calc.js';
import { today } from '../lib/dates.js';
import Khata from './Khata.jsx';
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

export default function Labours({ khataId, setKhataId, showSettings, setShowSettings }) {
  const D = useData();
  const { confirm } = useUI();
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const khataLabour = khataId ? D.labourById.get(khataId) : null;
  if (khataLabour) return <Khata labour={khataLabour} onBack={() => setKhataId(null)} />;
  if (showSettings) return <Settings onBack={() => setShowSettings(false)} />;

  const td = today();
  const card = (l) => {
    const b = balanceAt(l, D.byLabour.get(l.id) || [], td);
    return (
      <button key={l.id} className="card labour-card" onClick={() => setKhataId(l.id)}>
        <div>
          <div className="labour-name">{l.name}</div>
          <div className="muted small">{l.phone || t('l.noPhone')}</div>
        </div>
        <div className="labour-bal">
          <div><b>{b.c}</b> {t('c.cooler')}</div>
          <div className={b.m < 0 ? 'neg' : ''}><b>{fmtRs(b.m)}</b></div>
        </div>
        <span className="chev">›</span>
      </button>
    );
  };

  const archived = D.labours.filter((l) => l.archived);

  return (
    <div className="screen">
      <div className="row-actions">
        <button className="btn btn-primary btn-big grow" onClick={() => setAdding(true)}>{t('l.new')}</button>
        <button className="btn btn-big" onClick={() => setShowSettings(true)} aria-label={t('s.title')}>{t('l.settings')}</button>
      </div>

      {!D.active.length && <div className="empty-card">{t('l.empty')}</div>}
      {D.active.map(card)}

      {archived.length > 0 && (
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
