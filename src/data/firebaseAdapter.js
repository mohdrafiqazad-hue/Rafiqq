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
import { t } from '../i18n/index.js';

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
  'auth/network-request-failed': 'auth.network',
  'auth/popup-closed-by-user': 'auth.closed',
  'auth/cancelled-popup-request': 'auth.closed',
  'auth/unauthorized-domain': 'auth.domain',
  'auth/operation-not-allowed': 'auth.notAllowed',
  'auth/configuration-not-found': 'auth.notAllowed',
  'auth/too-many-requests': 'auth.tooMany',
};

export function authErrorMessage(err) {
  const key = AUTH_ERRORS[err?.code];
  return key ? t(key) : t('auth.unknown', { code: err?.code || err?.message || '?' });
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
  const xmonthsCol = collection(db, `${base}/xmonths`); // kharche, mahine ke hisab se
  const settingsRef = doc(db, `${base}/meta/settings`);

  return {
    kind: 'firebase',

    subscribe(onData, onStatus, onError) {
      const state = { rate: 10, xcats: [], labours: [], entries: [], expenses: [], loaded: { s: false, l: false, m: false, x: false } };
      const pending = { s: false, l: false, m: false, x: false };
      const emit = () => {
        const L = state.loaded;
        if (L.s && L.l && L.m && L.x) {
          onData({ rate: state.rate, xcats: state.xcats, labours: state.labours, entries: state.entries, expenses: state.expenses });
        }
        onStatus({ pending: pending.s || pending.l || pending.m || pending.x });
      };
      const fail = (err) => onError?.(err);
      const opts = { includeMetadataChanges: true };

      const u1 = onSnapshot(settingsRef, opts, (snap) => {
        state.rate = Number(snap.data()?.rate) > 0 ? Number(snap.data().rate) : 10;
        state.xcats = Array.isArray(snap.data()?.xcats) ? snap.data().xcats : [];
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

      const u4 = onSnapshot(xmonthsCol, opts, (snap) => {
        state.expenses = snap.docs.flatMap((d) => Object.values(d.data().x || {}));
        state.loaded.x = true;
        pending.x = snap.metadata.hasPendingWrites;
        emit();
      }, fail);

      return () => { u1(); u2(); u3(); u4(); };
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

    /** Kharcha save. Date badli ho to purane mahine se hatao. */
    saveExpense(x, oldDate) {
      const writes = [setDoc(doc(xmonthsCol, monthKey(x.d)), { x: { [x.id]: x } }, { merge: true })];
      if (oldDate && monthKey(oldDate) !== monthKey(x.d)) {
        writes.push(updateDoc(doc(xmonthsCol, monthKey(oldDate)), new FieldPath('x', x.id), deleteField()));
      }
      return Promise.all(writes);
    },

    deleteExpense(x) {
      return updateDoc(doc(xmonthsCol, monthKey(x.d)), new FieldPath('x', x.id), deleteField());
    },

    newExpenseId() {
      return doc(xmonthsCol).id;
    },

    setCategories(xcats) {
      return setDoc(settingsRef, { xcats }, { merge: true });
    },

    async importData({ labours, entries, rate, expenses = [], xcats = null }) {
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
      const xByMonth = new Map();
      for (const x of expenses) {
        const mk = monthKey(x.d);
        if (!xByMonth.has(mk)) xByMonth.set(mk, {});
        xByMonth.get(mk)[x.id] = x;
      }
      for (const [mk, map] of xByMonth) ops.push((b) => b.set(doc(xmonthsCol, mk), { x: map }, { merge: true }));
      if (rate) ops.push((b) => b.set(settingsRef, { rate }, { merge: true }));
      if (xcats) ops.push((b) => b.set(settingsRef, { xcats }, { merge: true }));

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
