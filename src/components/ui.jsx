// Toast (chhota message) aur Confirm (pakka? haan/nahi) dialog
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const UICtx = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const toast = useCallback((text, type = 'ok', ms = 3200) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-1), { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
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
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.text}</div>
        ))}
      </div>
      {dialog && (
        <div className="modal-bg" onClick={() => close(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {dialog.title && <h3>{dialog.title}</h3>}
            {dialog.message && <div className="modal-msg">{dialog.message}</div>}
            <div className="modal-actions">
              <button className="btn" onClick={() => close(false)}>{dialog.cancelText || 'Nahi'}</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>
                {dialog.okText || 'Haan'}
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
          <button className="icon-btn" onClick={onClose} aria-label="Band karein">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
