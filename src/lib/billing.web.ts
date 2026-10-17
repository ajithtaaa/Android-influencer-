import { api, type Pack } from './api';

// Web (the test link): Stripe Checkout. In demo mode a purchase is simulated.

export interface StorePrice {
  [productId: string]: string;
}

export async function loadPrices(packs: Pack[]): Promise<StorePrice> {
  return Object.fromEntries(packs.map((p) => [p.id, `$${(p.priceUsdCents / 100).toFixed(2)}`]));
}

export async function buy(pack: Pack, opts: { demo: boolean; stripe: boolean }): Promise<'purchased' | 'cancelled' | 'pending'> {
  if (opts.stripe) {
    const { url } = await api.stripeCheckout(pack.id);
    window.location.href = url;
    return 'pending';
  }
  if (opts.demo) {
    await api.demoGrant(pack.id);
    return 'purchased';
  }
  throw new Error('Payments are not available yet');
}

export function disconnect() {}
