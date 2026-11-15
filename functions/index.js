// Firebase Cloud Functions (server par chalte hain; Blaze plan chahiye).
// entryAlert: jaise hi koi nayi entry save hoti hai, malik ko WhatsApp Business se message.
// waTest: Settings ke "Test message" button ke liye.

import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { buildMessage, newEntries, sendWhatsApp } from './notify.js';

initializeApp();
// Database Mumbai (asia-south1) me hai, isliye function bhi wahin
setGlobalOptions({ region: 'asia-south1', maxInstances: 3 });
const db = getFirestore();

const apiBase = () => process.env.WA_API_BASE || 'https://graph.facebook.com';

async function saveStatus(data) {
  await db.doc('private/waStatus').set({ ...data, at: FieldValue.serverTimestamp() }, { merge: true });
}

async function labourData(labourId) {
  const [lab, months] = await Promise.all([
    db.doc(`biz/main/labours/${labourId}`).get(),
    db.collection('biz/main/months').get(),
  ]);
  const labour = { id: labourId, ...(lab.data() || { name: labourId }) };
  const entries = months.docs.flatMap((d) => Object.values(d.data().e || {})).filter((x) => x.l === labourId);
  return { labour, entries };
}

export const entryAlert = onDocumentWritten('biz/main/months/{ym}', async (event) => {
  const before = event.data?.before?.data()?.e || {};
  const after = event.data?.after?.data()?.e || {};
  const added = newEntries(before, after);
  // Backup import jaisi ek saath bahut saari entries par message nahi
  if (!added.length || added.length > 5) return;

  const cfg = (await db.doc('private/whatsapp').get()).data();
  if (!cfg?.enabled) return;

  for (const e of added) {
    if (e.byRole === 'owner' && !cfg.ownerToo) continue;
    try {
      const { labour, entries } = await labourData(e.l);
      const msg = buildMessage(labour, entries, e);
      const id = await sendWhatsApp(cfg, msg, { base: apiBase() });
      await saveStatus({ ok: true, error: '', last: `${labour.name} · ${e.d}`, messageId: id });
    } catch (err) {
      logger.error('WhatsApp alert fail', err);
      await saveStatus({ ok: false, error: String(err?.message || err).slice(0, 300), last: `${e.l} · ${e.d}` });
    }
  }
});

export const waTest = onDocumentCreated('private/whatsapp/tests/{id}', async (event) => {
  const cfg = (await db.doc('private/whatsapp').get()).data() || {};
  const sample = { l: 'test', d: new Date().toISOString().slice(0, 10), t: 10, r: 2, p: 8, m: 50, k: 10, by: 'Test', byRole: 'test' };
  const msg = buildMessage({ id: 'test', name: 'Test Labour' }, [sample], sample);
  try {
    const id = await sendWhatsApp(cfg, msg, { base: apiBase() });
    await event.data.ref.set({ ok: true, messageId: id, doneAt: FieldValue.serverTimestamp() }, { merge: true });
    await saveStatus({ ok: true, error: '', last: 'Test message' });
  } catch (err) {
    await event.data.ref.set({ ok: false, error: String(err?.message || err).slice(0, 300), doneAt: FieldValue.serverTimestamp() }, { merge: true });
    await saveStatus({ ok: false, error: String(err?.message || err).slice(0, 300), last: 'Test message' });
  }
});
