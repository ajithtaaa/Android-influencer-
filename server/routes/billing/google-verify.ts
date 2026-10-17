import { HttpError } from '../../errors';
import { verifyPlayPurchase } from '../../googlePlay';
import { body, route } from '../../http';
import { addCredits, findPack, getCredits, once } from '../../store';

// Called by the Android app after a Google Play purchase. Credits are granted
// once per purchase token; the app then consumes the purchase.
export default route(['POST'], async (req, _res, { userId }) => {
  const { productId, purchaseToken } = body<{ productId?: string; purchaseToken?: string }>(req);
  const pack = productId ? findPack(productId) : undefined;
  if (!pack || !purchaseToken) throw new HttpError(400, 'Invalid purchase');
  await verifyPlayPurchase(pack.id, purchaseToken, userId);
  await once(`play:${purchaseToken}`, async () => {
    await addCredits(userId, pack.credits);
  });
  return { credits: await getCredits(userId) };
});
