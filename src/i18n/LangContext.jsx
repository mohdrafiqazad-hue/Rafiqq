import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getLang, setLang, LANGS } from './index.js';

const LangCtx = createContext({ lang: 'hl', change: () => {} });

export function LangProvider({ children }) {
  const [lang, setL] = useState(getLang());
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'hi';
  }, [lang]);
  const change = useCallback((l) => {
    setLang(l);
    setL(l);
  }, []);
  return <LangCtx.Provider value={{ lang, change }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** Bhasha chunne ke 3 button */
export function LangPicker({ big }) {
  const { lang, change } = useLang();
  return (
    <div className={`seg ${big ? '' : 'seg-small'} lang-seg`} role="radiogroup" aria-label="Language">
      {LANGS.map(([code, label]) => (
        <button key={code} role="radio" aria-checked={lang === code} className={lang === code ? 'on' : ''} onClick={() => change(code)}>
          {label}
        </button>
      ))}
    </div>
  );
}
