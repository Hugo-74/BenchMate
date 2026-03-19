// api/notify.js — Vercel Serverless Function + Cron daily
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db  = getFirestore();
const fcm = getMessaging();

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  if (auth !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const now = new Date();
    const usersSnap = await db.collection('users').get();
    let sent = 0;
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const fcmToken = data.fcmToken;
      const lots = data.lots ? JSON.parse(data.lots) : [];
      if (!fcmToken || !lots.length) continue;
      for (const lot of lots) {
        if (!lot.exp || lot.notifOn === false) continue;
        const today  = new Date(); today.setHours(0,0,0,0);
        const expDate = new Date(lot.exp + 'T00:00:00'); expDate.setHours(0,0,0,0);
        const daysLeft = Math.round((expDate - today) / 86400000);
        const threshold = lot.notifDays !== undefined ? lot.notifDays : 7;
        if (daysLeft < 0 || daysLeft > threshold) continue;
        const sentRef = db.collection('notif_sent').doc(userDoc.id + '_' + lot.id + '_' + daysLeft);
        if ((await sentRef.get()).exists) continue;
        const body = daysLeft === 0
          ? `${lot.nom} expire aujourd'hui !`
          : `${lot.nom} expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
        try {
          await fcm.send({
            token: fcmToken,
            notification: { title: 'BenchMate — Stock', body },
            webpush: {
              notification: { icon: '/icon-192.png' },
              fcmOptions: { link: 'https://bench-mate-one.vercel.app/#lots' }
            }
          });
          await sentRef.set({ sentAt: now.toISOString() });
          sent++;
        } catch(e) { console.error('FCM', userDoc.id, e.message); }
      }
    }
    return res.status(200).json({ ok: true, sent });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
