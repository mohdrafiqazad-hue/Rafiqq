// 🎤 Bol kar entry: suno -> samjho -> form bharo. Save user khud dabata hai.
import { useEffect, useRef, useState } from 'react';
import { t, getLang } from '../i18n/index.js';
import { bestParse, VOICE_LANGS } from '../lib/voice.js';
import { listen, speechSupported } from '../lib/speech.js';

const LANG_KEY = 'mgm-voice-lang';
const defaultLang = () => {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && VOICE_LANGS.some(([c]) => c === v)) return v;
  } catch { /* ignore */ }
  return getLang() === 'en' ? 'en-IN' : 'hi-IN';
};

const ERRORS = {
  'not-allowed': 'v.errPerm',
  'service-not-allowed': 'v.errPerm',
  'no-speech': 'v.errNoSpeech',
  network: 'v.errNet',
  'audio-capture': 'v.errMic',
  'language-not-supported': 'v.errLang',
};

/**
 * labours: jin labour me se naam dhoondhna hai
 * currentId: abhi chuna hua labour
 * onApply({ labourId, values: { t?, r?, p?, m? } })
 */
export default function VoiceEntry({ labours, currentId, onApply }) {
  const [lang, setLang] = useState(defaultLang);
  const [state, setState] = useState('idle'); // idle | listening
  const [live, setLive] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const stopRef = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);

  if (!speechSupported()) {
    return <p className="muted small voice-na">{t('v.notSupported')}</p>;
  }

  const changeLang = (e) => {
    setLang(e.target.value);
    try { localStorage.setItem(LANG_KEY, e.target.value); } catch { /* ignore */ }
  };

  const start = () => {
    if (state === 'listening') {
      stopRef.current?.();
      return;
    }
    if (!navigator.onLine) {
      setError(t('v.errNet'));
      return;
    }
    setError('');
    setResult(null);
    setLive('');
    setState('listening');
    stopRef.current = listen({
      lang,
      onInterim: setLive,
      onResult: (alts) => {
        const p = bestParse(alts, labours);
        const values = Object.fromEntries(Object.entries(p.fields).map(([k, v]) => [k, String(v.value)]));
        const labour = p.labour || labours.find((l) => l.id === currentId) || null;
        setResult({ ...p, usedLabour: labour, guessed: !p.labour });
        if (labour && Object.keys(values).length) onApply({ labourId: labour.id, values });
        else if (!Object.keys(values).length) setError(t('v.errNothing'));
      },
      onError: (code) => setError(t(ERRORS[code] || 'v.errOther', { code })),
      onEnd: () => setState('idle'),
    });
  };

  const FIELD_LABEL = { t: t('col.t'), r: t('col.r'), p: t('col.p'), m: t('col.m') };

  return (
    <div className="voice">
      <div className="voice-row">
        <button type="button" className={`btn voice-btn ${state === 'listening' ? 'on' : ''}`} onClick={start} aria-pressed={state === 'listening'}>
          {state === 'listening' ? `● ${t('v.listening')}` : `🎤 ${t('v.start')}`}
        </button>
        <select className="voice-lang" value={lang} onChange={changeLang} aria-label={t('v.lang')}>
          {VOICE_LANGS.map(([c, label]) => <option key={c} value={c}>{label}</option>)}
        </select>
      </div>
      {state === 'listening' && <div className="voice-live">{live || t('v.speakNow')}</div>}
      {state === 'idle' && !result && !error && <p className="muted small voice-hint">{t('v.example')}</p>}
      {error && <div className="warn-box">{error}</div>}
      {result && (
        <div className="voice-result">
          <div className="small"><b>{t('v.heard')}:</b> “{result.text}”</div>
          <div className="voice-chips">
            <span className={`pill ${result.guessed ? 'pill-orange' : 'pill-green'}`}>
              {result.usedLabour ? result.usedLabour.name : t('v.noName')}
              {result.guessed && result.usedLabour ? ` (${t('v.selected')})` : ''}
            </span>
            {['t', 'r', 'p', 'm'].filter((k) => result.fields[k]).map((k) => (
              <span key={k} className="pill pill-blue">
                {FIELD_LABEL[k]}: {result.fields[k].value}
                {result.fields[k].parts.length > 1 ? ` (${result.fields[k].parts.join('+')})` : ''}
              </span>
            ))}
          </div>
          {result.leftover.length > 0 && <div className="warn-box">{t('v.leftover', { n: result.leftover.join(', ') })}</div>}
          {!result.usedLabour && <div className="warn-box">{t('v.pickName')}</div>}
          <div className="muted small">{t('v.check')}</div>
        </div>
      )}
    </div>
  );
}
