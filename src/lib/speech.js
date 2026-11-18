// Phone ke Chrome ka awaz pehchaanne wala system (Web Speech API).
// Awaz Google ke server par text banti hai, isliye internet chahiye.

export function speechSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Ek baar suno. onInterim(text) bolte waqt, onResult([alternatives]) aakhir me.
 * Lautata hai: stop() function.
 */
export function listen({ lang, onInterim, onResult, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = false;
  let finals = null;
  let lastInterim = '';
  rec.onresult = (ev) => {
    let interim = '';
    const parts = [];
    for (let i = 0; i < ev.results.length; i++) {
      const res = ev.results[i];
      if (res.isFinal) parts.push(res);
      else interim += res[0].transcript;
    }
    if (parts.length) {
      // Har hisse ke alternatives jod kar poori line ke alternatives
      const max = Math.max(...parts.map((p) => p.length));
      finals = [];
      for (let k = 0; k < max; k++) finals.push(parts.map((p) => (p[k] || p[0]).transcript).join(' ').trim());
    }
    lastInterim = (parts.map((p) => p[0].transcript).join(' ') + ' ' + interim).trim();
    onInterim?.(lastInterim);
  };
  rec.onerror = (e) => onError?.(e.error || 'error');
  rec.onend = () => {
    if (finals && finals.length) onResult?.(finals);
    else if (lastInterim) onResult?.([lastInterim]);
    onEnd?.();
  };
  try {
    rec.start();
  } catch (e) {
    onError?.('start');
    onEnd?.();
  }
  return () => {
    try { rec.stop(); } catch { /* ignore */ }
  };
}
