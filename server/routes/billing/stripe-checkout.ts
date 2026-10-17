import { env } from '../../env';
import { HttpError } from '../../errors';
import { body, route } from '../../http';
import { findPack } from '../../store';
import { stripe } from '../../stripe';

// Web only. The Android build never calls this (Google Play Billing is used there).
export default route(['POST'], async (req, _res, { userId }) => {
  const { packId } = body<{ packId?: string }>(req);
  const pack = packId ? findPack(packId) : undefined;
  if (!pack) throw new HttpError(400, 'Unknown pack');
  const base = env.publicUrl || `https://${req.headers.host}`;
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    client_reference_id: userId,
    metadata: { userId, packId: pack.id },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: pack.priceUsdCents,
        product_data: { name: `${pack.credits} swap credits` },
      },
    }],
    success_url: `${base}/credits?paid=1`,
    cancel_url: `${base}/credits`,
  });
  return { url: session.url };
});
