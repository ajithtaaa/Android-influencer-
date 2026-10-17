import Stripe from 'stripe';
import { env } from './env';
import { HttpError } from './errors';

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.stripeSecretKey) throw new HttpError(503, 'Card payments are not configured');
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}
