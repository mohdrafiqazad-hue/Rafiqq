import { useMemo } from 'react';
import { useData } from '../data/DataContext.jsx';
import { fmtRs, pendingLists } from '../lib/calc.js';
import { today } from '../lib/dates.js';
import { t } from '../i18n/index.js';

/** Aaj tak: kitne labour se kitna paisa lena hai, kitne cooler bahar. Dabao to Labour tab me wahi list. */
export default function PendingBanner({ onOpen }) {
  const D = useData();
  const p = useMemo(() => pendingLists(D.labours, D.entries, today()), [D.labours, D.entries]);
  if (!p.money.length && !p.cooler.length) return null;
  return (
    <div className="pend-banner">
      <button className="pend-chip pend-money" onClick={() => onOpen('paisa')}>
        💰 {fmtRs(p.totalMoney)} <small>· {t('pd.count', { n: p.money.length })}</small>
      </button>
      <button className="pend-chip pend-cooler" onClick={() => onOpen('cooler')}>
        🧊 {p.totalCooler} {t('c.cooler')} <small>· {t('pd.count', { n: p.cooler.length })}</small>
      </button>
    </div>
  );
}
