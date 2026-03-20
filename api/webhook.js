// api/webhook.js — reçoit les events Stripe et met à jour Firestore
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}
const db = getFirestore();

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch(e) {
    return res.status(400).json({ error: 'Webhook error: ' + e.message });
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const uid = session.metadata?.uid;
    if (uid) {
      await db.collection('users').doc(uid).set({
        pro: true,
        plan: session.metadata?.plan,
        stripeCustomerId: session.customer,
        proSince: new Date().toISOString()
      }, { merge: true });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    // Trouver l'utilisateur par stripeCustomerId
    const snap = await db.collection('users')
      .where('stripeCustomerId', '==', session.customer).get();
    snap.forEach(doc => {
      doc.ref.set({ pro: false, plan: null }, { merge: true });
    });
  }

  return res.status(200).json({ received: true });
}
