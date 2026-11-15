// Naya user: malik ki approval ka intezaar (ya mana ho gaya)
import { t } from '../i18n/index.js';
import { LangPicker, useLang } from '../i18n/LangContext.jsx';
import { useOnline } from '../data/DataContext.jsx';
import { COMPANY } from '../lib/reports.js';

export default function Waiting({ user, role, onLogout }) {
  useLang();
  const online = useOnline();
  const rejected = role === 'rejected';
  return (
    <div className="login">
      <LangPicker />
      <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="80" height="80" />
      <h1>{COMPANY}</h1>
      <div className={`card waiting ${rejected ? 'waiting-no' : ''}`}>
        <div className="waiting-icon">{rejected ? '⛔' : '⏳'}</div>
        <h3>{rejected ? t('w.rejectedTitle') : t('w.title')}</h3>
        <p>{rejected ? t('w.rejected') : t('w.msg')}</p>
        <p className="muted small">{t('w.account', { email: user.email || user.name || '' })}</p>
        {!online && <p className="warn-box">{t('w.offline')}</p>}
      </div>
      <button className="btn" onClick={onLogout}>{t('w.switch')}</button>
    </div>
  );
}
