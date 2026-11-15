import { useRef, useState } from 'react';
import { useData } from '../data/DataContext.jsx';
import { Sheet, useUI } from '../components/ui.jsx';
import { NumField } from '../components/common.jsx';
import { buildBackup, parseBackup, planImport } from '../lib/backup.js';
import { fmtRs } from '../lib/calc.js';
import { fmtDateTime, today } from '../lib/dates.js';
import { downloadFile } from '../export/index.js';
import { t } from '../i18n/index.js';
import { LangPicker } from '../i18n/LangContext.jsx';

function Team() {
  const D = useData();
  const { confirm } = useUI();
  const team = D.team;
  if (!team) return null;
  const me = D.user?.uid;
  const pending = team.members.filter((m) => m.role === 'pending');
  const others = team.members.filter((m) => m.role !== 'pending' && m.uid !== me);
  const who = (m) => (
    <div className="member-who">
      <b>{m.name || m.email}</b>
      <span className="muted small">{m.email}</span>
    </div>
  );
  return (
    <div className="card" id="team">
      <div className="card-title">{t('tm.title')}</div>
      <p className="muted small">{t('tm.help')}</p>
      {pending.length > 0 && (
        <>
          <div className="team-sub">{t('tm.requests', { n: pending.length })}</div>
          {pending.map((m) => (
            <div key={m.uid} className="member member-pending">
              {who(m)}
              <div className="member-btns">
                <button className="btn btn-small btn-primary" onClick={() => team.setRole(m, 'manager')}>{t('tm.asManager')}</button>
                <button className="btn btn-small btn-primary" onClick={() => team.setRole(m, 'labour')}>{t('tm.asLabour')}</button>
                <button className="btn btn-small btn-danger-outline" onClick={() => team.setRole(m, 'rejected')}>{t('tm.reject')}</button>
              </div>
            </div>
          ))}
        </>
      )}
      <div className="team-sub">{t('tm.members')}</div>
      <div className="member">
        <div className="member-who"><b>{D.user?.name || D.user?.email} {t('tm.you')}</b><span className="muted small">{D.user?.email}</span></div>
        <span className="pill pill-blue">{t('role.owner')}</span>
      </div>
      {!others.length && <p className="muted small">{t('tm.none')}</p>}
      {others.map((m) => (
        <div key={m.uid} className="member">
          {who(m)}
          <span className={`pill ${m.role === 'rejected' ? 'pill-orange' : 'pill-green'}`}>{t(`role.${m.role}`)}</span>
          {m.role !== 'owner' && (
            <div className="member-btns">
              {m.role !== 'manager' && <button className="btn btn-small" onClick={() => team.setRole(m, 'manager')}>{t('tm.makeManager')}</button>}
              {m.role !== 'labour' && <button className="btn btn-small" onClick={() => team.setRole(m, 'labour')}>{t('tm.makeLabour')}</button>}
              <button
                className="btn btn-small btn-danger-outline"
                onClick={async () => {
                  if (await confirm({ title: t('tm.removeTitle', { name: m.name || m.email }), message: t('tm.removeMsg'), okText: t('tm.remove'), danger: true })) team.remove(m);
                }}
              >
                {t('tm.remove')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Settings({ onBack }) {
  const D = useData();
  const { toast, confirm } = useUI();
  const [rate, setRate] = useState(String(D.rate));
  const [plan, setPlan] = useState(null);
  const [useFileRate, setUseFileRate] = useState(false);
  const fileRef = useRef(null);

  const saveRate = async () => {
    const r = Number(rate);
    if (!(r > 0)) return toast(t('s.rateBad'), 'err');
    if (r === D.rate) return toast(t('s.rateSame'));
    const ok = await confirm({ title: t('s.rateTitle'), message: t('s.rateMsg', { r: fmtRs(r) }), okText: t('s.rateOk') });
    if (ok) D.setRate(r);
  };

  const backup = () => {
    const data = buildBackup({ rate: D.rate, labours: D.labours, entries: D.entries, expenses: D.expenses, xcats: D.xcats });
    const file = new File([JSON.stringify(data, null, 1)], `MGM_backup_${today()}.json`, { type: 'application/json' });
    downloadFile(file);
    toast(t('s.backupDone', { l: D.labours.length, e: D.entries.length, x: D.expenses.length }));
  };

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const incoming = parseBackup(await f.text());
      const p = planImport({ labours: D.labours, entries: D.entries, expenses: D.expenses }, incoming);
      setUseFileRate(false);
      setPlan({ ...p, incoming, fileName: f.name });
    } catch (err) {
      toast(err.code ? t(err.code, err.vars) : err.message, 'err', 6000);
    }
  };

  const doImport = () => {
    const { incoming } = plan;
    D.importData({
      labours: incoming.labours,
      entries: incoming.entries,
      expenses: incoming.expenses,
      xcats: incoming.xcats,
      rate: useFileRate && incoming.rate ? incoming.rate : null,
    });
    setPlan(null);
  };

  return (
    <div className="screen">
      <div className="subhead">
        {onBack && <button className="btn btn-small" onClick={onBack}>{t('c.back')}</button>}
        <div className="subhead-title">{t('s.title')}</div>
      </div>

      <Team />

      <div className="card">
        <div className="card-title">{t('s.lang')}</div>
        <LangPicker big />
      </div>

      <div className="card">
        <div className="card-title">{t('s.rate')}</div>
        {D.can.settings ? (
          <>
            <div className="rate-row">
              <NumField label={t('s.rateNow', { r: fmtRs(D.rate) })} value={rate} onChange={setRate} decimal onEnter={saveRate} />
              <button className="btn btn-primary" onClick={saveRate}>{t('s.save')}</button>
            </div>
            <p className="muted small">{t('s.rateHelp')}</p>
          </>
        ) : (
          <p>{t('s.rateNow', { r: fmtRs(D.rate) })} <span className="muted small">· {t('pm.ownerOnly')}</span></p>
        )}
      </div>

      {D.can.seeReports && (
        <div className="card">
          <div className="card-title">{t('s.backup')}</div>
          <button className="btn full" onClick={backup}>{t('s.backupDl')}</button>
          {D.can.settings && <button className="btn full" onClick={() => fileRef.current?.click()}>{t('s.backupUp')}</button>}
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={pickFile} />
          <p className="muted small">{t('s.backupHelp')}</p>
        </div>
      )}

      <div className="card">
        <div className="card-title">{t('s.account')}</div>
        {D.storeKind === 'local' ? (
          <p className="warn-box">{t('s.demo')}</p>
        ) : (
          <p className="small">{t('s.login')}: <b>{D.user?.email}</b><br />
            {t('pm.role', { role: t(`role.${D.role}`) })}<br />
            <span className="muted">{D.online ? (D.pending ? t('s.syncing') : t('s.synced')) : t('s.offline')}</span>
          </p>
        )}
        <button
          className="btn btn-danger-outline full"
          onClick={async () => {
            const msg = D.storeKind === 'firebase' && D.pending ? t('s.logoutWarn') : t('s.logoutMsg');
            if (await confirm({ title: t('c.logout'), message: msg, okText: t('c.logout'), danger: true })) D.logout();
          }}
        >
          {t('c.logout')}
        </button>
      </div>

      <p className="muted small center">{t('s.version')}</p>

      {plan && (
        <Sheet title={t('s.impTitle')} onClose={() => setPlan(null)}>
          <p className="small muted">
            {t('s.impFile', { f: plan.fileName })}
            {plan.incoming.exportedAt ? ` · ${fmtDateTime(new Date(plan.incoming.exportedAt))}` : ''}
          </p>
          <div className="plan">
            <div>{t('s.impLab', { n: plan.labourCount, a: plan.newLabours, b: plan.updatedLabours })}</div>
            <div>{t('s.impEnt', { n: plan.entryCount, a: plan.newEntries, b: plan.replacedEntries })}</div>
            {plan.expenseCount > 0 && <div>{t('s.impExp', { n: plan.expenseCount, a: plan.newExpenses, b: plan.replacedExpenses })}</div>}
            {plan.skipped > 0 && <div className="warn-box">{t('s.impSkip', { n: plan.skipped })}</div>}
          </div>
          {plan.replacedEntries > 0 && <p className="small">{t('s.impReplace')}</p>}
          {plan.rate && plan.rate !== D.rate && (
            <label className="check">
              <input type="checkbox" checked={useFileRate} onChange={(e) => setUseFileRate(e.target.checked)} />
              {t('s.impRate', { r: fmtRs(plan.rate), now: fmtRs(D.rate) })}
            </label>
          )}
          <div className="row-actions">
            <button className="btn" onClick={() => setPlan(null)}>{t('c.no')}</button>
            <button className="btn btn-primary btn-big grow" onClick={doImport}>{t('s.impOk')}</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
