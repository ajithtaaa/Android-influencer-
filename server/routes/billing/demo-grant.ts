import { isDemo } from '../../env';
import { HttpError } from '../../errors';
import { body, route } from '../../http';
import { addCredits, findPack, getCredits } from '../../store';

// Demo link only: simulates a purchase so testers can try the full flow.
// Disabled automatically once the real Higgsfield key is configured.
export default route(['POST'], async (req, _res, { userId }) => {
  if (!isDemo()) throw new HttpError(404, 'Not found');
  const pack = findPack(body<{ packId?: string }>(req).packId ?? '');
  if (!pack) throw new HttpError(400, 'Unknown pack');
  await addCredits(userId, pack.credits);
  return { credits: await getCredits(userId) };
});
