// api/create-checkout.js — crée une session Stripe Checkout
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  monthly: 'price_1TD57p0r2JFkuNoCs2JMguv3',
  yearly:  'price_1TD5990r2JFkuNoCunOquHCr'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, uid, email } = req.body;
  if (!plan || !uid || !PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: 'https://bench-mate-one.vercel.app/?pro=success',
      cancel_url:  'https://bench-mate-one.vercel.app/?pro=cancel',
      metadata: { uid, plan }
    });
    return res.status(200).json({ url: session.url });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
