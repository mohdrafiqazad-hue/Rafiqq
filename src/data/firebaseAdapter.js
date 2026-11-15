// Firebase (Google login + Firestore) wala data store.
// Data ka dhaancha:
//   users/{uid}/meta/settings      -> { rate }
//   users/{uid}/labours/{labourId} -> { name, phone, archived, o, ob? }
//   users/{uid}/months/{YYYY-MM}   -> { e: { "<labourId>_<date>": { l, d, t, r, p, m, k } } }
// Ek mahine ki saari entries ek document me rehti hain, taaki app kholne par kam "reads" lagein
// aur Firebase ka free plan saalon tak chale.

import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, connectAuthEmulator, signInWithCredential,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, updateDoc, deleteField, FieldPath, writeBatch, connectFirestoreEmulator,
} from 'firebase/firestore';
import { firebaseConfig, useEmulator } from '../firebase-config.js';
import { entryKey } from '../lib/calc.js';
import { monthKey } from '../lib/dates.js';

let app;
let auth;
let db;

function init() {
  if (app) return;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = 'hi';
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // Automated test ke liye (sirf emulator build me): bina popup ke login
    window.__mgmTestLogin = (email) => signInWithCredential(
      auth,
      GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name: 'Test' })),
    );
  }
}

const AUTH_ERRORS = {
  'auth/network-request-failed': 'Internet nahi hai. Pehli baar login ke liye internet chahiye.',
  'auth/popup-closed-by-user': 'Login window band ho gayi. Dobara "Google se login" dabayein.',
  'auth/cancelled-popup-request': 'Login window band ho gayi. Dobara try karein.',
  'auth/unauthorized-domain':
    'Ye website Firebase me allowed nahi hai. Firebase Console > Authentication > Settings > Authorized domains me ise jodein.',
  'auth/operation-not-allowed':
    'Firebase me Google login chalu nahi hai. Firebase Console > Authentication > Sign-in method me Google ko Enable karein.',
  'auth/too-many-requests': 'Bahut baar try hua. Thodi der baad dobara karein.',
};

export function authErrorMessage(err) {
  return AUTH_ERRORS[err?.code] || `Login nahi ho paaya (${err?.code || err?.message || 'anjaan galti'}).`;
}

export function watchAuth(cb) {
  init();
  getRedirectResult(auth).catch(() => {});
  return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL } : null));
}

export async function login() {
  init();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export function logout() {
  init();
  return signOut(auth);
}

export function createFirebaseStore(uid) {
  init();
  const base = `users/${uid}`;
  const laboursCol = collection(db, `${base}/labours`);
  const monthsCol = collection(db, `${base}/months`);
  const settingsRef = doc(db, `${base}/meta/settings`);

  return {
    kind: 'firebase',

    subscribe(onData, onStatus, onError) {
      const state = { rate: 10, labours: [], entries: [], loaded: { s: false, l: false, m: false } };
      const pending = { s: false, l: false, m: false };
      const emit = () => {
        if (state.loaded.s && state.loaded.l && state.loaded.m) {
          onData({ rate: state.rate, labours: state.labours, entries: state.entries });
        }
        onStatus({ pending: pending.s || pending.l || pending.m });
      };
      const fail = (err) => onError?.(err);
      const opts = { includeMetadataChanges: true };

      const u1 = onSnapshot(settingsRef, opts, (snap) => {
        state.rate = Number(snap.data()?.rate) > 0 ? Number(snap.data().rate) : 10;
        state.loaded.s = true;
        pending.s = snap.metadata.hasPendingWrites;
        emit();
      }, fail);

      const u2 = onSnapshot(laboursCol, opts, (snap) => {
        state.labours = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        state.loaded.l = true;
        pending.l = snap.metadata.hasPendingWrites;
        emit();
      }, fail);

      const u3 = onSnapshot(monthsCol, opts, (snap) => {
        state.entries = snap.docs.flatMap((d) => Object.values(d.data().e || {}));
        state.loaded.m = true;
        pending.m = snap.metadata.hasPendingWrites;
        emit();
      }, fail);

      return () => { u1(); u2(); u3(); };
    },

    // Note: internet na ho to Firestore ka promise tab tak poora nahi hota jab tak data server par na pahunche.
    // Data phone me turant save ho jaata hai, isliye UI in promises ka intezaar nahi karta.
    saveEntry(e) {
      const ref = doc(monthsCol, monthKey(e.d));
      return setDoc(ref, { e: { [entryKey(e.l, e.d)]: e } }, { merge: true });
    },

    deleteEntry(l, d) {
      const ref = doc(monthsCol, monthKey(d));
      return updateDoc(ref, new FieldPath('e', entryKey(l, d)), deleteField());
    },

    saveLabour(lab) {
      const { id, ...rest } = lab;
      if (!rest.ob) rest.ob = deleteField();
      return setDoc(doc(laboursCol, id), rest, { merge: true });
    },

    newLabourId() {
      return doc(laboursCol).id;
    },

    setRate(rate) {
      return setDoc(settingsRef, { rate }, { merge: true });
    },

    async importData({ labours, entries, rate }) {
      const ops = [];
      for (const l of labours) {
        const { id, ...rest } = l;
        ops.push((b) => b.set(doc(laboursCol, id), rest, { merge: true }));
      }
      const byMonth = new Map();
      for (const e of entries) {
        const mk = monthKey(e.d);
        if (!byMonth.has(mk)) byMonth.set(mk, {});
        byMonth.get(mk)[entryKey(e.l, e.d)] = e;
      }
      for (const [mk, map] of byMonth) ops.push((b) => b.set(doc(monthsCol, mk), { e: map }, { merge: true }));
      if (rate) ops.push((b) => b.set(settingsRef, { rate }, { merge: true }));

      const commits = [];
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db);
        ops.slice(i, i + 400).forEach((op) => op(batch));
        commits.push(batch.commit());
      }
      return Promise.all(commits);
    },
  };
}
