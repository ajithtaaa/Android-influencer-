import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { env } from '../../env';
import { addCredits, findPack, once } from '../../store';
import { stripe } from '../../stripe';

// Stripe verifies the signature against the raw body (set by api/index.ts).
const rawBody = (req: VercelRequest) => (req as VercelRequest & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody(req), String(req.headers['stripe-signature']), env.stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature failed', err);
    return res.status(400).send('Bad signature');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pack = findPack(session.metadata?.packId ?? '');
    const userId = session.metadata?.userId;
    if (pack && userId && session.payment_status === 'paid') {
      await once(`stripe:${session.id}`, async () => {
        await addCredits(userId, pack.credits);
      });
    }
  }
  res.status(200).json({ received: true });
}
