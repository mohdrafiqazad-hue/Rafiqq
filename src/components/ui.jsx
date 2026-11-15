// Toast (chhota message) aur Confirm (pakka? haan/nahi) dialog
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { t } from '../i18n/index.js';

const UICtx = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const toast = useCallback((text, type = 'ok', ms = 3200) => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts.slice(-1), { id, text, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), ms);
  }, []);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    setDialog({ ...opts, resolve });
  }), []);

  const close = (val) => {
    dialog?.resolve(val);
    setDialog(null);
  };

  return (
    <UICtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast toast-${x.type}`}>{x.text}</div>
        ))}
      </div>
      {dialog && (
        <div className="modal-bg" onClick={() => close(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {dialog.title && <h3>{dialog.title}</h3>}
            {dialog.message && <div className="modal-msg">{dialog.message}</div>}
            <div className="modal-actions">
              <button className="btn" onClick={() => close(false)}>{dialog.cancelText || t('c.no')}</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>
                {dialog.okText || t('c.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </UICtx.Provider>
  );
}

export const useUI = () => useContext(UICtx);

/** Neeche se khulne wali sheet (form ke liye) */
export function Sheet({ title, onClose, children }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={t('c.close')}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
